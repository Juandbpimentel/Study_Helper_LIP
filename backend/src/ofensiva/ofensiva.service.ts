import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  calcularOfensivaPorDiasAtivos,
  OfensivaResumo,
} from '@/common/utils/streak.utils';
import { addDays, startOfDay } from '@/common/utils/date.utils';
import type { Usuario } from '@prisma/client';

@Injectable()
export class OfensivaService {
  constructor(private readonly prisma: PrismaService) {}

  fromUsuario(
    usuario: Pick<
      Usuario,
      | 'ofensivaAtual'
      | 'ofensivaBloqueiosTotais'
      | 'ofensivaBloqueiosUsados'
      | 'ofensivaUltimoDiaAtivo'
    >,
  ): OfensivaResumo {
    const bloqueiosTotais =
      typeof usuario.ofensivaBloqueiosTotais === 'number'
        ? usuario.ofensivaBloqueiosTotais
        : 2;

    if (!usuario.ofensivaUltimoDiaAtivo) {
      return {
        atual: 0,
        bloqueiosTotais,
        bloqueiosUsados: 0,
        bloqueiosRestantes: bloqueiosTotais,
        ultimoDiaAtivo: null,
      };
    }

    const hoje = startOfDay(new Date());
    const ultimo = startOfDay(usuario.ofensivaUltimoDiaAtivo);
    const diff = Math.floor(
      (hoje.getTime() - ultimo.getTime()) / (24 * 60 * 60 * 1000),
    );
    const faltasEntre = Math.max(0, diff - 1);
    const bloqueiosUsadosBase =
      typeof usuario.ofensivaBloqueiosUsados === 'number'
        ? usuario.ofensivaBloqueiosUsados
        : 0;
    const usados = bloqueiosUsadosBase + faltasEntre;
    const estourou = usados > bloqueiosTotais;

    return {
      atual:
        estourou || typeof usuario.ofensivaAtual !== 'number'
          ? 0
          : usuario.ofensivaAtual,
      bloqueiosTotais,
      bloqueiosUsados: estourou ? bloqueiosTotais : usados,
      bloqueiosRestantes: estourou ? 0 : Math.max(0, bloqueiosTotais - usados),
      ultimoDiaAtivo: ultimo.toISOString().slice(0, 10),
    };
  }

  async calcular(
    usuarioId: number,
    bloqueiosTotais = 2,
  ): Promise<OfensivaResumo> {
    const hoje = startOfDay(new Date());
    const inicio = addDays(hoje, -400);

    const registros = await this.prisma.registroEstudo.findMany({
      where: { creatorId: usuarioId, dataEstudo: { gte: inicio } },
      orderBy: { dataEstudo: 'desc' },
      select: { dataEstudo: true },
    });

    return calcularOfensivaPorDiasAtivos(
      registros.map((r) => r.dataEstudo),
      bloqueiosTotais,
    );
  }

  async recalcularEAtualizar(usuarioId: number): Promise<OfensivaResumo> {
    const resumo = await this.calcular(usuarioId, 2);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ofensivaAtual: resumo.atual,
        ofensivaBloqueiosTotais: resumo.bloqueiosTotais,
        ofensivaBloqueiosUsados: resumo.bloqueiosUsados,
        ofensivaUltimoDiaAtivo: resumo.ultimoDiaAtivo
          ? startOfDay(new Date(resumo.ultimoDiaAtivo))
          : null,
        ofensivaAtualizadaEm: new Date(),
      },
    });

    return resumo;
  }

  async atualizarPorTempoTodosUsuarios(): Promise<void> {
    const usuarios = await this.prisma.usuario.findMany({
      select: {
        id: true,
        ofensivaAtual: true,
        ofensivaBloqueiosTotais: true,
        ofensivaBloqueiosUsados: true,
        ofensivaUltimoDiaAtivo: true,
      },
    });

    for (const u of usuarios) {
      if (!u.ofensivaUltimoDiaAtivo) continue;
      const resumo = this.fromUsuario(u);

      const precisaAtualizar =
        u.ofensivaAtual !== resumo.atual ||
        u.ofensivaBloqueiosUsados !== resumo.bloqueiosUsados;

      if (!precisaAtualizar) continue;

      await this.prisma.usuario.update({
        where: { id: u.id },
        data: {
          ofensivaAtual: resumo.atual,
          ofensivaBloqueiosTotais: resumo.bloqueiosTotais,
          ofensivaBloqueiosUsados: resumo.bloqueiosUsados,
          ofensivaAtualizadaEm: new Date(),
        },
      });
    }
  }
}
