import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptSecret, encryptSecret } from '@/common/utils/crypto.utils';
import {
  addDays,
  getOffsetFromFirstDay,
  startOfDay,
  startOfWeek,
} from '@/common/utils/date.utils';
import { DiaSemana, PrismaClient, StatusRevisao } from '@prisma/client';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

function looksLikeEncryptedSecret(v: string): boolean {
  const parts = v.split('.');
  return parts.length === 4 && parts[0] === 'v1';
}

function decryptMaybeEncryptedSecret(v: string): string {
  if (!looksLikeEncryptedSecret(v)) return v;
  return decryptSecret(v);
}

type UnknownRecord = Record<string, unknown>;

export type GoogleCalendarBackendStatus = {
  enabled: boolean;
  oauthConfigured: boolean;
  encryptionKeyConfigured: boolean;
  issues: string[];
};

export type GoogleIntegrationStatus = {
  connected: boolean;
  calendarId: string | null;
  backend: GoogleCalendarBackendStatus;
};

function isObjectRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

function getProp(obj: unknown, key: string): unknown {
  if (!isObjectRecord(obj)) return undefined;
  return obj[key];
}

function getNested(obj: unknown, ...keys: string[]): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    cur = getProp(cur, k);
    if (cur === undefined) return undefined;
  }
  return cur;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`${name} não definido`);
  return v;
}

function diaSemanaToByDay(dia: DiaSemana): string {
  switch (dia) {
    case DiaSemana.Dom:
      return 'SU';
    case DiaSemana.Seg:
      return 'MO';
    case DiaSemana.Ter:
      return 'TU';
    case DiaSemana.Qua:
      return 'WE';
    case DiaSemana.Qui:
      return 'TH';
    case DiaSemana.Sex:
      return 'FR';
    case DiaSemana.Sab:
      return 'SA';
    default:
      return 'MO';
  }
}

function formatGoogleAllDayDate(date: Date): string {
  const d = startOfDay(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Rgb = { r: number; g: number; b: number };

function parseHexRgb(input: string): Rgb | null {
  const raw = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;

  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return null;
  return { r, g, b };
}

function rgbDistanceSq(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly lastAccessCheckAt = new Map<number, number>();
  private readonly accessCheckTtlMs = 60_000;

  private eventColorsPalettePromise?: Promise<Array<{ id: string; rgb: Rgb }>>;

  private readonly prismaDb: PrismaClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    this.prismaDb = this.prisma as unknown as PrismaClient;
  }

  private getEventColorsPalette(
    calendar: ReturnType<typeof google.calendar>,
  ): Promise<Array<{ id: string; rgb: Rgb }>> {
    if (this.eventColorsPalettePromise) return this.eventColorsPalettePromise;

    this.eventColorsPalettePromise = (async () => {
      try {
        const res = await calendar.colors.get({});
        const eventColors = res.data?.event ?? undefined;
        if (!eventColors) return [];

        const out: Array<{ id: string; rgb: Rgb }> = [];
        for (const [id, cfg] of Object.entries(eventColors)) {
          if (!isObjectRecord(cfg)) continue;
          const bg = cfg.background;
          if (typeof bg !== 'string') continue;
          const rgb = parseHexRgb(bg);
          if (!rgb) continue;
          out.push({ id, rgb });
        }

        return out;
      } catch (e) {
        this.logger.warn(
          `Falha ao buscar paleta de cores do Google: ${String(e)}`,
        );
        return [];
      }
    })();

    return this.eventColorsPalettePromise;
  }

  private async resolveGoogleEventColorId(
    calendar: ReturnType<typeof google.calendar>,
    temaCorHex: string | null | undefined,
  ): Promise<string | undefined> {
    if (!temaCorHex) return undefined;
    const temaRgb = parseHexRgb(temaCorHex);
    if (!temaRgb) return undefined;

    const palette = await this.getEventColorsPalette(calendar);
    if (!palette.length) {
      return '1';
    }

    let bestId = palette[0].id;
    let bestDist = rgbDistanceSq(temaRgb, palette[0].rgb);
    for (let i = 1; i < palette.length; i++) {
      const d = rgbDistanceSq(temaRgb, palette[i].rgb);
      if (d < bestDist) {
        bestDist = d;
        bestId = palette[i].id;
      }
    }

    return bestId;
  }

  private isOauthConfigured(): boolean {
    return (
      Boolean(env('GOOGLE_CLIENT_ID')) &&
      Boolean(env('GOOGLE_CLIENT_SECRET')) &&
      Boolean(env('GOOGLE_REDIRECT_URI'))
    );
  }

  private isEncryptionKeyConfigured(): boolean {
    const raw = env('GOOGLE_TOKEN_ENCRYPTION_KEY');
    if (!raw) return false;

    const isLikelyBase64 = /[^0-9a-f]/i.test(raw);
    const buf = Buffer.from(raw, isLikelyBase64 ? 'base64' : 'hex');
    return buf.length === 32;
  }

  getBackendStatus(): GoogleCalendarBackendStatus {
    const issues: string[] = [];

    const hasClientId = Boolean(env('GOOGLE_CLIENT_ID'));
    const hasClientSecret = Boolean(env('GOOGLE_CLIENT_SECRET'));
    const hasRedirect = Boolean(env('GOOGLE_REDIRECT_URI'));
    const oauthConfigured = hasClientId && hasClientSecret && hasRedirect;

    if (!hasClientId) issues.push('GOOGLE_CLIENT_ID ausente');
    if (!hasClientSecret) issues.push('GOOGLE_CLIENT_SECRET ausente');
    if (!hasRedirect) issues.push('GOOGLE_REDIRECT_URI ausente');

    const encryptionKeyRaw = env('GOOGLE_TOKEN_ENCRYPTION_KEY');
    if (!encryptionKeyRaw) {
      issues.push('GOOGLE_TOKEN_ENCRYPTION_KEY ausente');
    } else if (!this.isEncryptionKeyConfigured()) {
      issues.push(
        'GOOGLE_TOKEN_ENCRYPTION_KEY inválida (esperado 32 bytes em base64 ou hex)',
      );
    }

    const encryptionKeyConfigured = this.isEncryptionKeyConfigured();
    const enabled = oauthConfigured && encryptionKeyConfigured;

    return {
      enabled,
      oauthConfigured,
      encryptionKeyConfigured,
      issues,
    };
  }

  async getUserIntegrationStatus(
    userId: number,
  ): Promise<GoogleIntegrationStatus> {
    const backend = this.getBackendStatus();
    if (!backend.enabled) {
      return { connected: false, calendarId: null, backend };
    }

    await this.verifyAccessAndCleanupIfRevoked(userId);

    const integration =
      await this.prismaDb.googleCalendarIntegration.findUnique({
        where: { creatorId: userId },
        select: { calendarId: true },
      });

    return {
      connected: Boolean(integration),
      calendarId: integration?.calendarId ?? null,
      backend,
    };
  }

  private assertBackendHealthyForGoogleRoutes(): void {
    const status = this.getBackendStatus();
    if (status.enabled) return;

    throw new HttpException(
      {
        code: 'GOOGLE_CALENDAR_NOT_CONFIGURED',
        message:
          'Integração com Google Calendar não está configurada neste backend.',
        googleCalendar: status,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private throwIntegrationDisconnected(code: string, message: string): never {
    throw new HttpException(
      { code, message, integrationRemoved: true },
      HttpStatus.UNAUTHORIZED,
    );
  }

  private isRevokedOrUnauthorizedError(e: unknown): boolean {
    const isNumber = (v: unknown): v is number => typeof v === 'number';

    const statusCandidates: unknown[] = [
      getProp(e, 'code'),
      getProp(e, 'status'),
      getNested(e, 'response', 'status'),
      getNested(e, 'response', 'data', 'error', 'code'),
    ];

    const status = statusCandidates.find(isNumber);

    if (typeof status === 'number' && ![401, 403].includes(status))
      return false;

    const safeStringify = (v: unknown): string => {
      try {
        return typeof v === 'string' ? v : JSON.stringify(v);
      } catch {
        return String(v);
      }
    };

    const data = getNested(e, 'response', 'data');

    const parts: string[] = [];
    const message = getProp(e, 'message');
    if (typeof message === 'string') parts.push(message);
    if (typeof data === 'string') parts.push(data);

    if (isObjectRecord(data)) {
      const errorField = getProp(data, 'error');
      const errorDescription = getProp(data, 'error_description');

      if (typeof errorField === 'string') parts.push(errorField);
      if (typeof errorDescription === 'string') parts.push(errorDescription);

      if (isObjectRecord(errorField)) {
        const errorMessage = getProp(errorField, 'message');
        const errorStatus = getProp(errorField, 'status');
        if (typeof errorMessage === 'string') parts.push(errorMessage);
        if (typeof errorStatus === 'string') parts.push(errorStatus);
      }

      parts.push(safeStringify(data));
    }

    const lowered = parts.join(' ').toLowerCase();

    return (
      lowered.includes('invalid_grant') ||
      lowered.includes('invalid_token') ||
      lowered.includes('token has been revoked') ||
      lowered.includes('revoked') ||
      lowered.includes('unauthorized') ||
      lowered.includes('unauthenticated') ||
      lowered.includes('invalid credentials') ||
      lowered.includes('login required')
    );
  }

  private shouldCheckAccessNow(userId: number, force?: boolean): boolean {
    if (force) return true;
    const last = this.lastAccessCheckAt.get(userId);
    if (!last) return true;
    return Date.now() - last > this.accessCheckTtlMs;
  }

  private buildOAuthClient() {
    const clientId = requireEnv('GOOGLE_CLIENT_ID');
    const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
    const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  buildAuthUrl(userId: number): string {
    this.assertBackendHealthyForGoogleRoutes();

    const state = this.jwt.sign(
      {
        userId,
        nonce: Math.random().toString(16).slice(2),
      },
      { expiresIn: '10m' },
    );

    const oauth2 = this.buildOAuthClient();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [GOOGLE_CALENDAR_SCOPE],
      include_granted_scopes: true,
      state,
    });
  }

  async handleOAuthCallback(
    code: string,
    stateJwt: string,
  ): Promise<{ redirectUrl: string }> {
    this.assertBackendHealthyForGoogleRoutes();

    const payload = this.jwt.verify<{ userId: number }>(stateJwt);
    const userId = payload?.userId;
    if (typeof userId !== 'number') throw new Error('State inválido');

    const oauth2 = this.buildOAuthClient();
    const { tokens } = await oauth2.getToken(code);

    const expiryDate =
      typeof tokens.expiry_date === 'number'
        ? new Date(tokens.expiry_date)
        : null;

    await this.prismaDb.$transaction(async (tx: PrismaClient) => {
      const existing = await tx.googleCalendarIntegration.findUnique({
        where: { creatorId: userId },
        select: {
          refreshTokenEncrypted: true,
          accessToken: true,
          tokenType: true,
          scope: true,
          expiryDate: true,
        },
      });

      const refreshToken = tokens.refresh_token ?? undefined;
      const refreshTokenEncrypted = refreshToken
        ? encryptSecret(refreshToken)
        : (existing?.refreshTokenEncrypted ?? null);

      const accessToken =
        typeof tokens.access_token === 'string'
          ? encryptSecret(tokens.access_token)
          : undefined;

      await tx.googleCalendarIntegration.upsert({
        where: { creatorId: userId },
        create: {
          creatorId: userId,
          accessToken: accessToken ?? null,
          refreshTokenEncrypted,
          tokenType: tokens.token_type ?? null,
          scope: tokens.scope ?? null,
          expiryDate,
        },
        update: {
          accessToken: accessToken ?? existing?.accessToken ?? null,
          refreshTokenEncrypted,
          tokenType: tokens.token_type ?? existing?.tokenType ?? null,
          scope: tokens.scope ?? existing?.scope ?? null,
          expiryDate: expiryDate ?? existing?.expiryDate ?? null,
        },
      });
    });

    await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: true,
    });

    void this.ensureCalendar(userId)
      .then(() => this.syncAllForUser(userId))
      .catch((e) => {
        this.logger.warn(
          `Falha no sync inicial do Google Calendar (user ${userId}): ${String(e)}`,
        );
      });

    const redirectBase =
      env('FRONTEND_URL') ?? env('APP_FRONTEND_URL') ?? 'http://localhost:3000';
    const redirectPath = env('GOOGLE_OAUTH_REDIRECT_PATH') ?? '/profile';

    const normalizedBase = redirectBase.replace(/\/$/, '');
    const redirectUrl = `${normalizedBase}${redirectPath}?googleCalendar=connected`;

    return { redirectUrl };
  }

  async disconnect(userId: number): Promise<void> {
    this.lastAccessCheckAt.delete(userId);

    await this.deleteCalendarBeforeCleanup(userId);

    await this.prismaDb.googleCalendarIntegration.deleteMany({
      where: { creatorId: userId },
    });

    await this.clearStoredGoogleEventIds(userId);
  }

  /**
   * Verifica se a integração ainda tem acesso ao Google.
   * Se estiver revogada/inválida, remove a integração no banco.
   * Não lança erro (ideal para rodar pós-login).
   */
  async verifyAccessAndCleanupIfRevoked(userId: number): Promise<boolean> {
    if (!this.isOauthConfigured()) return false;

    try {
      const client = await this.getCalendarClientForOperation(userId, {
        throwOnRevoked: false,
        forceCheck: true,
      });
      return Boolean(client);
    } catch {
      return false;
    }
  }

  private async clearStoredGoogleEventIds(userId: number): Promise<void> {
    await this.prismaDb.$transaction([
      this.prismaDb.slotCronograma.updateMany({
        where: { creatorId: userId, googleEventId: { not: null } },
        data: { googleEventId: null },
      }),
      this.prismaDb.revisaoProgramada.updateMany({
        where: { creatorId: userId, googleEventId: { not: null } },
        data: { googleEventId: null },
      }),
    ]);
  }

  private async deleteCalendarBeforeCleanup(userId: number): Promise<void> {
    try {
      const oauth = await this.getOAuthClientOrNull(userId);
      const calendarId = oauth?.integration?.calendarId;
      if (!oauth || !calendarId) return;

      const calendar = google.calendar({ version: 'v3', auth: oauth.oauth2 });
      await calendar.calendars.delete({ calendarId });
    } catch (e) {
      this.logger.warn(
        `Falha ao excluir calendário do Google antes do disconnect (user ${userId}): ${String(e)}`,
      );
    }
  }

  private async getOAuthClientOrNull(userId: number) {
    if (!this.isOauthConfigured()) return null;

    const integration =
      await this.prismaDb.googleCalendarIntegration.findUnique({
        where: { creatorId: userId },
        select: {
          calendarId: true,
          accessToken: true,
          refreshTokenEncrypted: true,
          tokenType: true,
          scope: true,
          expiryDate: true,
        },
      });
    if (!integration) return null;

    const oauth2 = this.buildOAuthClient();
    let refreshToken: string | undefined;
    try {
      refreshToken = integration.refreshTokenEncrypted
        ? decryptSecret(integration.refreshTokenEncrypted)
        : undefined;
    } catch (e) {
      this.logger.warn(
        `Falha ao descriptografar refresh token (user ${userId}). Removendo integração para exigir reconexão. ${String(e)}`,
      );
      await this.disconnect(userId);
      this.throwIntegrationDisconnected(
        'GOOGLE_INTEGRATION_INVALID',
        'Sua integração com Google Calendar está inválida. Conecte novamente.',
      );
    }

    let accessToken: string | undefined;
    if (typeof integration.accessToken === 'string') {
      try {
        accessToken = decryptMaybeEncryptedSecret(integration.accessToken);
      } catch (e) {
        this.logger.warn(
          `Falha ao descriptografar access token (user ${userId}). Ignorando access token. ${String(e)}`,
        );
        accessToken = undefined;
      }
    }

    oauth2.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: integration.tokenType ?? undefined,
      scope: integration.scope ?? undefined,
      expiry_date: integration.expiryDate
        ? integration.expiryDate.getTime()
        : undefined,
    });

    oauth2.on('tokens', (tokens) => {
      void this.persistRefreshedTokens(userId, tokens);
    });

    return { oauth2, integration };
  }

  private async getCalendarClientForOperation(
    userId: number,
    opts: { throwOnRevoked: boolean; forceCheck?: boolean },
  ) {
    const oauth = await this.getOAuthClientOrNull(userId);
    if (!oauth) return null;

    const calendarId =
      oauth.integration.calendarId ?? (await this.ensureCalendar(userId));
    if (!calendarId) return null;

    const calendar = google.calendar({ version: 'v3', auth: oauth.oauth2 });

    if (this.shouldCheckAccessNow(userId, opts.forceCheck)) {
      try {
        await calendar.calendarList.list({ maxResults: 1 });
        this.lastAccessCheckAt.set(userId, Date.now());
      } catch (e) {
        if (this.isRevokedOrUnauthorizedError(e)) {
          await this.disconnect(userId);
          await this.clearStoredGoogleEventIds(userId);
          if (opts.throwOnRevoked) {
            this.throwIntegrationDisconnected(
              'GOOGLE_INTEGRATION_REVOKED',
              'A integração com Google Calendar foi removida/expirou. Conecte novamente.',
            );
          }
          return null;
        }
        throw e;
      }
    }

    return { calendar, calendarId };
  }

  private async persistRefreshedTokens(userId: number, tokens: unknown) {
    try {
      const t = (tokens ?? {}) as Record<string, unknown>;
      const expiryDate =
        typeof t.expiry_date === 'number' ? new Date(t.expiry_date) : undefined;

      let accessTokenEncrypted: string | undefined;
      if (typeof t.access_token === 'string') {
        try {
          accessTokenEncrypted = encryptSecret(t.access_token);
        } catch (e) {
          this.logger.warn(
            `Falha ao criptografar access token (user ${userId}). ${String(e)}`,
          );
        }
      }

      await this.prismaDb.googleCalendarIntegration.update({
        where: { creatorId: userId },
        data: {
          accessToken: accessTokenEncrypted,
          tokenType:
            typeof t.token_type === 'string' ? t.token_type : undefined,
          scope: typeof t.scope === 'string' ? t.scope : undefined,
          expiryDate,
          refreshTokenEncrypted:
            typeof t.refresh_token === 'string'
              ? encryptSecret(t.refresh_token)
              : undefined,
        },
      });
    } catch (e) {
      this.logger.warn(`Falha ao persistir refresh de tokens: ${String(e)}`);
    }
  }

  private async ensureCalendar(userId: number): Promise<string | null> {
    const existing = await this.prismaDb.googleCalendarIntegration.findUnique({
      where: { creatorId: userId },
      select: { calendarId: true },
    });

    if (existing?.calendarId) return existing.calendarId;

    const oauth = await this.getOAuthClientOrNull(userId);
    if (!oauth) return null;

    const calendar = google.calendar({ version: 'v3', auth: oauth.oauth2 });

    const summary = env('GOOGLE_CALENDAR_APP_NAME') ?? 'Study Helper';
    const created = await calendar.calendars.insert({
      requestBody: { summary },
    });

    const calendarId = created.data.id;
    if (!calendarId) throw new Error('Falha ao criar calendário no Google');

    await this.prismaDb.$transaction(async (tx: PrismaClient) => {
      await tx.googleCalendarIntegration.update({
        where: { creatorId: userId },
        data: { calendarId },
      });
    });

    return calendarId;
  }

  async syncAllForUser(userId: number): Promise<void> {
    await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: false,
    });

    await Promise.all([
      this.syncSlotsForUser(userId),
      this.syncOpenRevisionsForUser(userId),
    ]);
  }

  async forceSyncAllForUser(userId: number): Promise<void> {
    this.assertBackendHealthyForGoogleRoutes();

    await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: true,
    });

    await this.syncAllForUser(userId);
  }

  async resetAndResyncAllForUser(userId: number): Promise<void> {
    this.assertBackendHealthyForGoogleRoutes();

    const client = await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: true,
    });
    if (!client) return;

    const [slots, revisoes] = await this.prismaDb.$transaction([
      this.prismaDb.slotCronograma.findMany({
        where: { creatorId: userId, googleEventId: { not: null } },
        select: { googleEventId: true },
      }),
      this.prismaDb.revisaoProgramada.findMany({
        where: { creatorId: userId, googleEventId: { not: null } },
        select: { googleEventId: true },
      }),
    ]);

    const slotEventIds = slots
      .map((s) => s.googleEventId)
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
    const revisaoEventIds = revisoes
      .map((r) => r.googleEventId)
      .filter((v): v is string => typeof v === 'string' && v.length > 0);

    await Promise.all([
      this.deleteSlotEventsByEventIds(userId, slotEventIds),
      this.deleteRevisionEventsByEventIds(userId, revisaoEventIds),
    ]);

    await this.prismaDb.$transaction([
      this.prismaDb.slotCronograma.updateMany({
        where: { creatorId: userId, googleEventId: { not: null } },
        data: { googleEventId: null },
      }),
      this.prismaDb.revisaoProgramada.updateMany({
        where: { creatorId: userId, googleEventId: { not: null } },
        data: { googleEventId: null },
      }),
    ]);

    await this.syncAllForUser(userId);
  }

  async syncSlotsForUser(userId: number): Promise<void> {
    const client = await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: false,
    });
    if (!client) return;

    const usuario = await this.prismaDb.usuario.findUnique({
      where: { id: userId },
      select: { primeiroDiaSemana: true },
    });
    if (!usuario) return;

    const slots = await this.prismaDb.slotCronograma.findMany({
      where: { creatorId: userId },
      include: { tema: true },
    });

    await Promise.all(
      slots.map((slot) =>
        this.upsertSlotEvent(
          userId,
          client.calendarId,
          client.calendar,
          usuario.primeiroDiaSemana,
          slot,
        ),
      ),
    );
  }

  private async upsertSlotEvent(
    userId: number,
    calendarId: string,
    calendar: ReturnType<typeof google.calendar>,
    primeiroDiaSemana: DiaSemana,
    slot: {
      id: number;
      diaSemana: DiaSemana;
      tema: { tema: string; cor?: string | null };
      googleEventId: string | null;
    },
  ) {
    const hoje = startOfDay(new Date());
    const inicioSemana = startOfWeek(hoje, primeiroDiaSemana);
    const offset = getOffsetFromFirstDay(primeiroDiaSemana, slot.diaSemana);
    let dataAlvo = addDays(inicioSemana, offset);
    if (dataAlvo < hoje) dataAlvo = addDays(dataAlvo, 7);

    const startDate = formatGoogleAllDayDate(dataAlvo);
    const endDate = formatGoogleAllDayDate(addDays(dataAlvo, 1));

    const summary = `Cronograma: ${slot.tema.tema}`;
    const byDay = diaSemanaToByDay(slot.diaSemana);

    const colorId = await this.resolveGoogleEventColorId(
      calendar,
      slot.tema.cor,
    );

    const requestBody = {
      summary,
      description:
        'Evento recorrente gerado automaticamente pelo Study Helper (cronograma semanal).',
      start: { date: startDate },
      end: { date: endDate },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`],
      ...(colorId ? { colorId } : {}),
    };

    try {
      if (slot.googleEventId) {
        await calendar.events.update({
          calendarId,
          eventId: slot.googleEventId,
          requestBody,
        });
        return;
      }

      const created = await calendar.events.insert({
        calendarId,
        requestBody,
      });

      const eventId = created.data.id;
      if (!eventId) return;

      try {
        await this.prismaDb.$transaction(async (tx: PrismaClient) => {
          await tx.slotCronograma.update({
            where: { id: slot.id },
            data: { googleEventId: eventId },
          });
        });
      } catch (dbErr) {
        try {
          await calendar.events.delete({ calendarId, eventId });
        } catch {
          // Ignorar
        }
        throw dbErr;
      }
    } catch (e) {
      const status = getNested(e, 'response', 'status');
      const data = getNested(e, 'response', 'data');
      this.logger.warn(
        `Falha ao upsert slot ${slot.id} no Google Calendar (user ${userId}): ${String(e)}${typeof status === 'number' ? ` (status ${status})` : ''}${data ? ` - ${JSON.stringify(data)}` : ''}`,
      );
    }
  }

  async deleteSlotEventsByEventIds(
    userId: number,
    eventIds: string[],
  ): Promise<void> {
    const client = await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: false,
    });
    if (!client) return;

    await Promise.all(
      eventIds
        .filter((id) => typeof id === 'string' && id.length > 0)
        .map(async (eventId) => {
          try {
            await client.calendar.events.delete({
              calendarId: client.calendarId,
              eventId,
            });
          } catch (e) {
            this.logger.warn(
              `Falha ao deletar eventId ${eventId} (user ${userId}): ${String(e)}`,
            );
          }
        }),
    );
  }

  async deleteRevisionEventsByEventIds(
    userId: number,
    eventIds: string[],
  ): Promise<void> {
    const client = await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: false,
    });
    if (!client) return;

    await Promise.all(
      eventIds
        .filter((id) => typeof id === 'string' && id.length > 0)
        .map(async (eventId) => {
          try {
            await client.calendar.events.delete({
              calendarId: client.calendarId,
              eventId,
            });
          } catch (e) {
            this.logger.warn(
              `Falha ao deletar eventId ${eventId} (user ${userId}): ${String(e)}`,
            );
          }
        }),
    );
  }

  async syncOpenRevisionsForUser(userId: number): Promise<void> {
    const client = await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: false,
    });
    if (!client) return;

    const revisoes = await this.prismaDb.revisaoProgramada.findMany({
      where: {
        creatorId: userId,
        statusRevisao: {
          in: [
            StatusRevisao.Pendente,
            StatusRevisao.Adiada,
            StatusRevisao.Atrasada,
          ],
        },
      },
      include: {
        registroOrigem: { include: { tema: true } },
      },
    });

    await Promise.all(
      revisoes.map((r) =>
        this.upsertRevisionEvent(userId, client.calendarId, client.calendar, r),
      ),
    );
  }

  async syncRevisionById(userId: number, revisaoId: number): Promise<void> {
    const client = await this.getCalendarClientForOperation(userId, {
      throwOnRevoked: true,
      forceCheck: false,
    });
    if (!client) return;

    const revisao = await this.prismaDb.revisaoProgramada.findFirst({
      where: { id: revisaoId, creatorId: userId },
      include: { registroOrigem: { include: { tema: true } } },
    });
    if (!revisao) return;

    if (
      revisao.statusRevisao === StatusRevisao.Concluida ||
      revisao.statusRevisao === StatusRevisao.Expirada
    ) {
      if (revisao.googleEventId) {
        try {
          await client.calendar.events.delete({
            calendarId: client.calendarId,
            eventId: revisao.googleEventId,
          });
        } catch (e) {
          this.logger.warn(
            `Falha ao deletar evento da revisão ${revisaoId}: ${String(e)}`,
          );
        }
      }

      await this.prismaDb.revisaoProgramada.update({
        where: { id: revisaoId },
        data: { googleEventId: null },
      });
      return;
    }

    await this.upsertRevisionEvent(
      userId,
      client.calendarId,
      client.calendar,
      revisao,
    );
  }

  private async upsertRevisionEvent(
    userId: number,
    calendarId: string,
    calendar: ReturnType<typeof google.calendar>,
    revisao: {
      id: number;
      dataRevisao: Date;
      statusRevisao: StatusRevisao;
      googleEventId: string | null;
      registroOrigem: { tema: { tema: string; cor?: string | null } | null };
    },
  ) {
    const data = startOfDay(revisao.dataRevisao);
    const startDate = formatGoogleAllDayDate(data);
    const endDate = formatGoogleAllDayDate(addDays(data, 1));

    const tema = revisao.registroOrigem.tema?.tema ?? 'Tema';
    const summary = `Revisão: ${tema}`;

    const colorId = await this.resolveGoogleEventColorId(
      calendar,
      revisao.registroOrigem.tema?.cor,
    );

    const requestBody = {
      summary,
      description: `Revisão programada (${revisao.statusRevisao}) gerada automaticamente pelo Study Helper.`,
      start: { date: startDate },
      end: { date: endDate },
      ...(colorId ? { colorId } : {}),
    };

    try {
      if (revisao.googleEventId) {
        await calendar.events.update({
          calendarId,
          eventId: revisao.googleEventId,
          requestBody,
        });
        return;
      }

      const created = await calendar.events.insert({
        calendarId,
        requestBody,
      });

      const eventId = created.data.id;
      if (!eventId) return;

      try {
        await this.prismaDb.$transaction(async (tx: PrismaClient) => {
          await tx.revisaoProgramada.update({
            where: { id: revisao.id },
            data: { googleEventId: eventId },
          });
        });
      } catch (dbErr) {
        try {
          await calendar.events.delete({ calendarId, eventId });
        } catch {
          // ignora
        }
        throw dbErr;
      }
    } catch (e) {
      const status = getNested(e, 'response', 'status');
      const data = getNested(e, 'response', 'data');
      this.logger.warn(
        `Falha ao upsert revisão ${revisao.id} no Google Calendar (user ${userId}): ${String(e)}${typeof status === 'number' ? ` (status ${status})` : ''}${data ? ` - ${JSON.stringify(data)}` : ''}`,
      );
    }
  }
}
