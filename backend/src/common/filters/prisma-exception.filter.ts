import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ConflictException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError as any)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError | any,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const code = (exception as any)?.code;

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
      const err = new ConflictException(
        'Violação de unicidade no banco de dados',
      );
      res.status(err.getStatus()).json({
        statusCode: err.getStatus(),
        message: err.message,
        path: req?.url,
      });
      return;
    }

    // Outros erros conhecidos do Prisma podem ser mapeados aqui.

    // Se não for tratado, re-throw para o manipulador padrão lidar.
    throw exception;
  }
}
