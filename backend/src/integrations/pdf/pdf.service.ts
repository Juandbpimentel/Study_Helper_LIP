import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

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

  async generatePdf(request: PdfGenerateRequest): Promise<{
    buffer: Buffer;
    contentDisposition?: string;
  }> {
    this.assertBackendHealthyForPdfRoutes();

    const baseUrl = env('PDF_SERVICE_URL') as string;
    const url = `${baseUrl.replace(/\/$/, '')}/generate-pdf`;

    // Configuráveis via env
    const maxRetries = Number(env('PDF_REQUEST_MAX_RETRIES') ?? '6');
    const timeoutMs = Number(env('PDF_REQUEST_TIMEOUT_MS') ?? '10000'); // per attempt
    const baseDelay = Number(env('PDF_REQUEST_BASE_DELAY_MS') ?? '3000');
    const maxTotalMs = Number(env('PDF_REQUEST_MAX_TOTAL_MS') ?? '60000'); // total budget

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
          signal: controller.signal as any,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const contentDisposition =
            res.headers.get('content-disposition') ?? undefined;
          const ab = await res.arrayBuffer();
          return { buffer: Buffer.from(ab), contentDisposition };
        }

        // If 429 or 5xx: consider retrying
        const status = res.status;
        const raw = await res.text();
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

        // Non-retriable: forward error payload if present
        throw new HttpException(
          typeof parsed === 'object' && parsed !== null
            ? parsed
            : {
                code: 'PDF_MICROSERVICE_ERROR',
                message: 'Falha ao gerar PDF no microserviço.',
                statusCode: status,
                raw,
              },
          status as number,
        );
      } catch (err: any) {
        clearTimeout(timeout);
        lastError = err;

        const isAbort =
          err &&
          (err.name === 'AbortError' || (err.type && err.type === 'aborted'));
        const isNetwork =
          err &&
          (err.code === 'ECONNREFUSED' ||
            err.code === 'ECONNRESET' ||
            err.code === 'ENOTFOUND' ||
            err.code === 'ETIMEDOUT');

        if (
          attempt < maxRetries &&
          (isAbort || isNetwork || err instanceof Error)
        ) {
          const delayMs = Math.round(baseDelay * Math.pow(1.5, attempt - 1));
          this.logger.warn(
            `PDF request failed (attempt ${attempt}) - retrying in ${delayMs}ms: ${err?.message ?? String(err)}`,
          );
          await sleep(delayMs);
          continue;
        }

        this.logger.error('PDF request failed and will not be retried', err);
        break;
      }
    }

    // Exhausted retries / timeout
    const message =
      lastError && typeof lastError === 'object' && 'message' in lastError
        ? (lastError as any).message
        : 'Falha ao gerar PDF no microserviço.';

    throw new HttpException(
      {
        code: 'PDF_MICROSERVICE_ERROR',
        message,
        statusCode: 503,
        raw: JSON.stringify(lastError ?? {}),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
