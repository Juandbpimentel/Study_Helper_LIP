import { Request as ExpressRequest } from 'express';
import type { Usuario } from '@prisma/client';
import type { DiaSemana } from '@prisma/client';

export type AuthenticatedUser = {
  id: number;
  email: string;
  nome: string;
  versaoToken: string;
  primeiroDiaSemana: DiaSemana;
  planejamentoRevisoes: number[];
  maxSlotsPorDia: number | null;
  slotAtrasoToleranciaDias: number;
  slotAtrasoMaxDias: number;
  revisaoAtrasoExpiraDias: number | null;
  createdAt: Date;
  updatedAt: Date;
  ofensivaAtual: number;
  ofensivaBloqueiosTotais: number;
  ofensivaBloqueiosUsados: number;
  ofensivaUltimoDiaAtivo: Date | null;
};

export type AuthenticatedRequest = ExpressRequest & {
  user: AuthenticatedUser;
};

export type LoginRequest = ExpressRequest & {
  user: Usuario;
};
