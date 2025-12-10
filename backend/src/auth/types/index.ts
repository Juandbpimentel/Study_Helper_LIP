import { Request as ExpressRequest } from 'express';
import { Usuario } from '@prisma/client';

export type AuthenticatedRequest = ExpressRequest & {
  user: Usuario;
};
