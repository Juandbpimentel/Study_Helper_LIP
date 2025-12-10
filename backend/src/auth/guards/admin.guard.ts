import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

type RequestWithUser = Request & {
  user?: { isAdmin?: boolean };
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    if (!user || user.isAdmin !== true) {
      throw new ForbiddenException('Apenas administradores');
    }
    return true;
  }
}
