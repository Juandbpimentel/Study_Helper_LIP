import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (!isRecord(err)) return undefined;
  const msg = err.message;
  return typeof msg === 'string' ? msg : undefined;
}

function getErrorStringProp(err: unknown, prop: string): string | undefined {
  if (!isRecord(err)) return undefined;
  const v = err[prop];
  return typeof v === 'string' ? v : undefined;
}

function truncateForLogs(input: string, maxLen: number): string {
  if (input.length <= maxLen) return input;
  return `${input.slice(0, maxLen)}... (truncated)`;
}

function looksLikeCloudflareChallenge(res: Response, rawBody: string): boolean {
  const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
  const server = (res.headers.get('server') ?? '').toLowerCase();
  const body = rawBody.toLowerCase();

  const htmlish =
    contentType.includes('text/html') ||
    contentType.includes('text/plain') ||
    rawBody.trim().startsWith('<!DOCTYPE html') ||
    rawBody.trim().startsWith('<html');

  const cfMarkers =
    body.includes('just a moment') ||
    body.includes('_cf_chl_opt') ||
    body.includes('challenge-platform') ||
    body.includes('/cdn-cgi/challenge-platform') ||
    body.includes('cf-ray');

  return htmlish && (server.includes('cloudflare') || cfMarkers);
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function envBool(name: string): boolean {
  const v = env(name);
  if (!v) return false;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export type PdfBackendStatus = {
  enabled: boolean;
  urlConfigured: boolean;
  issues: string[];
};

export type PdfGenerateRequest = {
  templateName: string;
  fileName?: string;
  data: Record<string, unknown>;
};

@Injectable()
export class PdfService {
  getBackendStatus(): PdfBackendStatus {
    const issues: string[] = [];

    const enabledFlag = envBool('PDF_ENABLED');
    const url = env('PDF_SERVICE_URL');

    const urlConfigured = Boolean(url);
    if (!enabledFlag) issues.push('PDF_ENABLED desativado');
    if (!url) issues.push('PDF_SERVICE_URL ausente');

    return {
      enabled: enabledFlag && urlConfigured,
      urlConfigured,
      issues,
    };
  }

  private assertBackendHealthyForPdfRoutes(): void {
    const status = this.getBackendStatus();
    if (status.enabled) return;

    throw new HttpException(
      {
        code: 'PDF_NOT_CONFIGURED',
        message:
          'Integração com PDF não está configurada neste backend (PDF microservice opcional).',
        pdf: status,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private readonly logger = new Logger(PdfService.name);

  private async warmUpPdfService(baseUrl: string): Promise<void> {
    const warmupEnabled = envBool('PDF_WARMUP_ENABLED');
    if (!warmupEnabled) return;

    const healthPath = env('PDF_HEALTH_PATH') ?? '/health';
    const healthUrl = `${baseUrl.replace(/\/$/, '')}${healthPath.startsWith('/') ? '' : '/'}${healthPath}`;

    const maxTotalMs = Number(env('PDF_WARMUP_MAX_TOTAL_MS') ?? '240000');
    const intervalMs = Number(env('PDF_WARMUP_INTERVAL_MS') ?? '5000');
    const timeoutMs = Number(env('PDF_WARMUP_TIMEOUT_MS') ?? '5000');

    const start = Date.now();
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let attempt = 0;
    while (Date.now() - start < maxTotalMs) {
      attempt++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        this.logger.log(`PDF warm-up attempt ${attempt} -> ${healthUrl}`);
        const res = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain, */*',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const raw = await res.text();
        if (res.ok) {
          this.logger.log('PDF warm-up OK');
          return;
        }

        if (looksLikeCloudflareChallenge(res, raw)) {
          const rawPreview = truncateForLogs(raw, 800);
          throw new HttpException(
            {
              code: 'PDF_MICROSERVICE_BLOCKED',
              message:
                'O microserviço de PDF parece estar protegido por Cloudflare/anti-bot (desafio com HTML/JS) até mesmo no health. Isso bloqueia chamadas server-to-server do backend. Desative o desafio para o endpoint, faça allowlist do backend, ou use uma URL/origem sem Cloudflare.',
              statusCode: 503,
              raw: rawPreview,
            },
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        this.logger.warn(
          `PDF warm-up returned ${res.status}; retrying in ${intervalMs}ms`,
        );
      } catch (err: unknown) {
        clearTimeout(timeout);

        if (err instanceof HttpException) throw err;

        this.logger.warn(
          `PDF warm-up failed; retrying in ${intervalMs}ms: ${getErrorMessage(err) ?? String(err)}`,
        );
      }

      await sleep(intervalMs);
    }

    this.logger.warn(
      `PDF warm-up timed out after ${maxTotalMs}ms; proceeding to generate-pdf attempts`,
    );
  }

  async generatePdf(request: PdfGenerateRequest): Promise<{
    buffer: Buffer;
    contentDisposition?: string;
  }> {
    this.assertBackendHealthyForPdfRoutes();

    const baseUrl = env('PDF_SERVICE_URL') as string;
    const url = `${baseUrl.replace(/\/$/, '')}/generate-pdf`;

    await this.warmUpPdfService(baseUrl);

    const maxRetries = Number(env('PDF_REQUEST_MAX_RETRIES') ?? '6');
    const timeoutMs = Number(env('PDF_REQUEST_TIMEOUT_MS') ?? '10000');
    const baseDelay = Number(env('PDF_REQUEST_BASE_DELAY_MS') ?? '3000');
    const maxTotalMs = Number(env('PDF_REQUEST_MAX_TOTAL_MS') ?? '60000');

    const start = Date.now();

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let lastError: unknown = undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const elapsed = Date.now() - start;
      if (elapsed >= maxTotalMs) {
        this.logger.warn(
          `PDF request aborted after total timeout ${maxTotalMs}ms`,
        );
        break;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        this.logger.log(`PDF request attempt ${attempt} -> ${url}`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/pdf, application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const contentDisposition =
            res.headers.get('content-disposition') ?? undefined;
          const ab = await res.arrayBuffer();
          return { buffer: Buffer.from(ab), contentDisposition };
        }

        const status = res.status;
        const raw = await res.text();

        if (looksLikeCloudflareChallenge(res, raw)) {
          const rawPreview = truncateForLogs(raw, 800);
          throw new HttpException(
            {
              code: 'PDF_MICROSERVICE_BLOCKED',
              message:
                'O microserviço de PDF parece estar protegido por Cloudflare/anti-bot (desafio com HTML/JS). Isso bloqueia chamadas server-to-server do backend. Desative o desafio para o endpoint, faça allowlist do backend, ou use uma URL/origem sem Cloudflare.',
              statusCode: 503,
              raw: rawPreview,
            },
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        let parsed: unknown = undefined;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = undefined;
        }

        if (status === 429 || (status >= 500 && status < 600)) {
          lastError =
            typeof parsed === 'object' && parsed !== null
              ? parsed
              : { statusCode: status, raw };

          const retryAfterHeader = res.headers.get('retry-after');
          let delayMs = Math.round(baseDelay * Math.pow(1.5, attempt - 1));
          if (retryAfterHeader) {
            const retrySec = Number(retryAfterHeader);
            if (!Number.isNaN(retrySec) && retrySec > 0)
              delayMs = Math.max(delayMs, retrySec * 1000);
          }

          this.logger.warn(
            `PDF service returned ${status}, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`,
          );
          await sleep(delayMs);
          continue;
        }

        throw new HttpException(
          typeof parsed === 'object' && parsed !== null
            ? parsed
            : {
                code: 'PDF_MICROSERVICE_ERROR',
                message: 'Falha ao gerar PDF no microserviço.',
                statusCode: status,
                raw,
              },
          status,
        );
      } catch (err: unknown) {
        clearTimeout(timeout);

        if (err instanceof HttpException) {
          throw err;
        }

        lastError = err;

        const isAbort =
          getErrorStringProp(err, 'name') === 'AbortError' ||
          getErrorStringProp(err, 'type') === 'aborted';
        const isNetwork = [
          'ECONNREFUSED',
          'ECONNRESET',
          'ENOTFOUND',
          'ETIMEDOUT',
        ].includes(getErrorStringProp(err, 'code') ?? '');

        if (attempt < maxRetries && (isAbort || isNetwork)) {
          const delayMs = Math.round(baseDelay * Math.pow(1.5, attempt - 1));
          this.logger.warn(
            `PDF request failed (attempt ${attempt}) - retrying in ${delayMs}ms: ${getErrorMessage(err) ?? String(err)}`,
          );
          await sleep(delayMs);
          continue;
        }

        this.logger.error('PDF request failed and will not be retried', err);
        break;
      }
    }

    const message =
      getErrorMessage(lastError) ?? 'Falha ao gerar PDF no microserviço.';

    const rawOut = truncateForLogs(JSON.stringify(lastError ?? {}), 2000);

    throw new HttpException(
      {
        code: 'PDF_MICROSERVICE_ERROR',
        message,
        statusCode: 503,
        raw: rawOut,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
