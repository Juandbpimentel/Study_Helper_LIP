import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // If already an HttpException, preserve status and message
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      const body: any = {
        statusCode: status,
        ...(typeof payload === 'object' ? payload : { message: payload }),
        path: request?.url,
      };

      // In non-production, include stack/cause for easier debugging
      if (process.env.NODE_ENV !== 'production') {
        body.stack = (exception as any).stack;
        if ((exception as any).cause) body.cause = (exception as any).cause;
      }

      response.status(status).json(body);
      return;
    }

    // Unhandled exceptions -> 500
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const body: any = {
      statusCode: status,
      message: 'Internal server error',
      path: request?.url,
    };

    if (process.env.NODE_ENV !== 'production') {
      body.error = exception;
      body.stack = (exception as any)?.stack;
      if ((exception as any)?.cause) body.cause = (exception as any).cause;
    }

    response.status(status).json(body);
  }
}
