import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import {
  buildUniqueViolationMessage,
  getPrismaConstraintFields,
} from '@/common/utils/prisma.utils';

function getPrismaErrorCode(exception: unknown): string | undefined {
  if (typeof exception !== 'object' || exception === null) return undefined;
  const code = (exception as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const code = getPrismaErrorCode(exception);

    if (code === 'ETIMEDOUT') {
      const err = new ServiceUnavailableException(
        'Serviço temporariamente indisponível. Tente novamente mais tarde.',
      );
      res.status(err.getStatus()).json({
        statusCode: err.getStatus(),
        message: err.message,
        path: req?.url,
      });
      return;
    }

    if (code === 'P2002') {
      const fields = getPrismaConstraintFields(exception);
      const err = new BadRequestException(buildUniqueViolationMessage(fields));
      res.status(err.getStatus()).json({
        statusCode: err.getStatus(),
        message: err.message,
        fields,
        path: req?.url,
      });
      return;
    }

    // Outros erros conhecidos do Prisma podem ser mapeados aqui.

    // Se não for tratado, re-throw para o manipulador padrão lidar.
    throw exception;
  }
}
