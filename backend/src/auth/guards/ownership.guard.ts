import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { RESOURCE_KEY } from '@/auth/decorators/resource.decorator';

interface AuthenticatedRequest extends Request {
  user?: { id: number };
  params: { id?: string };
}

interface OwnableEntity {
  creatorId: number;
}

interface OwnableDelegate {
  findUnique: (args: {
    where: { id: number };
  }) => Promise<OwnableEntity | null>;
}

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceName = this.reflector.getAllAndOverride<string>(
      RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!resourceName) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const usuarioId = req.user?.id ?? null;
    const entidadeId = Number.parseInt(req.params?.id ?? '', 10);

    if (!usuarioId || Number.isNaN(entidadeId)) return false;
    const buscador = this.prisma[resourceName as keyof PrismaService] as
      | OwnableDelegate
      | undefined;

    if (!this.isOwnableDelegate(buscador))
      throw new NotFoundException('Recurso não encontrado');

    const entidade = await buscador.findUnique({
      where: { id: entidadeId },
    });

    if (!entidade) throw new NotFoundException('Recurso não encontrado');

    if (entidade.creatorId !== usuarioId)
      throw new ForbiddenException('Acesso negado');
    return true;
  }

  private isOwnableDelegate(delegate: unknown): delegate is OwnableDelegate {
    return (
      typeof delegate === 'object' &&
      delegate !== null &&
      'findUnique' in delegate &&
      typeof (delegate as { findUnique?: unknown }).findUnique === 'function'
    );
  }
}
