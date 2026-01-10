import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getOptionalErrorStack(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const stack = value.stack;
  return typeof stack === 'string' ? stack : undefined;
}

function getOptionalErrorCause(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  return Object.prototype.hasOwnProperty.call(value, 'cause')
    ? value.cause
    : undefined;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If already an HttpException, preserve status and message
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      const body: Record<string, unknown> = {
        statusCode: status,
        ...(isRecord(payload) ? payload : { message: payload }),
        path: request?.url,
      };

      // In non-production, include stack/cause for easier debugging
      if (process.env.NODE_ENV !== 'production') {
        const stack = getOptionalErrorStack(exception);
        const cause = getOptionalErrorCause(exception);
        if (stack) body.stack = stack;
        if (cause !== undefined) body.cause = cause;
      }

      response.status(status).json(body);
      return;
    }

    // Unhandled exceptions -> 500
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const body: Record<string, unknown> = {
      statusCode: status,
      message: 'Internal server error',
      path: request?.url,
    };

    if (process.env.NODE_ENV !== 'production') {
      body.error = exception;
      const stack = getOptionalErrorStack(exception);
      const cause = getOptionalErrorCause(exception);
      if (stack) body.stack = stack;
      if (cause !== undefined) body.cause = cause;
    }

    response.status(status).json(body);
  }
}
