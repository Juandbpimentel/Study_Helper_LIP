import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

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

  async generatePdf(request: PdfGenerateRequest): Promise<{
    buffer: Buffer;
    contentDisposition?: string;
  }> {
    this.assertBackendHealthyForPdfRoutes();

    const baseUrl = env('PDF_SERVICE_URL') as string;
    const url = `${baseUrl.replace(/\/$/, '')}/generate-pdf`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf, application/json',
      },
      body: JSON.stringify(request),
    });

    const contentDisposition =
      res.headers.get('content-disposition') ?? undefined;

    if (!res.ok) {
      const raw = await res.text();
      let parsed: unknown = undefined;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = undefined;
      }

      throw new HttpException(
        typeof parsed === 'object' && parsed !== null
          ? parsed
          : {
              code: 'PDF_MICROSERVICE_ERROR',
              message: 'Falha ao gerar PDF no microserviço.',
              statusCode: res.status,
              raw,
            },
        res.status as number,
      );
    }

    const ab = await res.arrayBuffer();
    return {
      buffer: Buffer.from(ab),
      contentDisposition,
    };
  }
}
