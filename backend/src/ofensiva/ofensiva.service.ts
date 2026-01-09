import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OfensivaResumo } from '@/common/utils/streak.utils';
import { addDays, startOfDay } from '@/common/utils/date.utils';
import { TipoRegistro, type Usuario } from '@prisma/client';

const OFENSIVA_BLOQUEIOS_MAX = 3;

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function diffDaysUtc(a: Date, b: Date): number {
  const aa = startOfDay(a).getTime();
  const bb = startOfDay(b).getTime();
  return Math.floor((aa - bb) / (24 * 60 * 60 * 1000));
}

@Injectable()
export class OfensivaService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularOfensivaComRecuperacao(args: {
    registrosAsc: Array<{ dataEstudo: Date; tipoRegistro: TipoRegistro }>;
    bloqueiosTotais: number;
  }): OfensivaResumo {
    const bloqueiosTotais = Math.max(
      0,
      Math.min(OFENSIVA_BLOQUEIOS_MAX, args.bloqueiosTotais),
    );

    if (!args.registrosAsc.length) {
      return {
        atual: 0,
        bloqueiosTotais,
        bloqueiosUsados: 0,
        bloqueiosRestantes: bloqueiosTotais,
        ultimoDiaAtivo: null,
      };
    }

    type DayAgg = { day: Date; reviewCount: number };
    const days: DayAgg[] = [];

    for (const r of args.registrosAsc) {
      const d = startOfDay(r.dataEstudo);
      const key = dayKey(d);

      const last = days.length ? days[days.length - 1] : undefined;
      if (!last || dayKey(last.day) !== key) {
        days.push({
          day: d,
          reviewCount: r.tipoRegistro === TipoRegistro.Revisao ? 1 : 0,
        });
      } else if (r.tipoRegistro === TipoRegistro.Revisao) {
        last.reviewCount += 1;
      }
    }

    let ofensivaAtual = 0;
    let bloqueiosUsados = 0;
    let lastActiveDay: Date | null = null;

    for (const { day, reviewCount } of days) {
      if (!lastActiveDay) {
        ofensivaAtual = 1;
        bloqueiosUsados = 0;
        lastActiveDay = day;
      } else {
        const diff = diffDaysUtc(day, lastActiveDay);
        if (diff > 0) {
          if (diff === 1) {
            ofensivaAtual += 1;
          } else {
            const faltas = diff - 1;
            const restantes = Math.max(0, bloqueiosTotais - bloqueiosUsados);
            if (faltas > restantes) {
              // Estourou: reinicia ofensiva no dia atual.
              ofensivaAtual = 1;
              bloqueiosUsados = 0;
            } else {
              bloqueiosUsados += faltas;
              ofensivaAtual += 1;
            }
          }

          lastActiveDay = day;
        }
      }

      // Recupera bloqueios ao concluir revisões (cada registro de revisão recupera 1, até o max).
      if (reviewCount > 0) {
        bloqueiosUsados = Math.max(0, bloqueiosUsados - reviewCount);
      }
    }

    const hoje = startOfDay(new Date());
    const ultimoDiaAtivo = lastActiveDay ? startOfDay(lastActiveDay) : null;

    if (!ultimoDiaAtivo) {
      return {
        atual: 0,
        bloqueiosTotais,
        bloqueiosUsados: 0,
        bloqueiosRestantes: bloqueiosTotais,
        ultimoDiaAtivo: null,
      };
    }

    const diffHoje = diffDaysUtc(hoje, ultimoDiaAtivo);
    const faltasEntreHojeEUltimo = Math.max(0, diffHoje - 1);
    const usadosTotal = bloqueiosUsados + faltasEntreHojeEUltimo;
    const estourou = usadosTotal > bloqueiosTotais;

    return {
      atual: estourou ? 0 : Math.max(0, ofensivaAtual),
      bloqueiosTotais,
      bloqueiosUsados: estourou ? bloqueiosTotais : usadosTotal,
      bloqueiosRestantes: estourou
        ? 0
        : Math.max(0, bloqueiosTotais - usadosTotal),
      ultimoDiaAtivo: dayKey(ultimoDiaAtivo),
    };
  }

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
        : OFENSIVA_BLOQUEIOS_MAX;

    const bloqueiosTotaisClamped = Math.max(
      0,
      Math.min(OFENSIVA_BLOQUEIOS_MAX, bloqueiosTotais),
    );

    if (!usuario.ofensivaUltimoDiaAtivo) {
      return {
        atual: 0,
        bloqueiosTotais: bloqueiosTotaisClamped,
        bloqueiosUsados: 0,
        bloqueiosRestantes: bloqueiosTotaisClamped,
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
    const estourou = usados > bloqueiosTotaisClamped;

    return {
      atual:
        estourou || typeof usuario.ofensivaAtual !== 'number'
          ? 0
          : usuario.ofensivaAtual,
      bloqueiosTotais: bloqueiosTotaisClamped,
      bloqueiosUsados: estourou ? bloqueiosTotaisClamped : Math.max(0, usados),
      bloqueiosRestantes: estourou
        ? 0
        : Math.max(0, bloqueiosTotaisClamped - Math.max(0, usados)),
      ultimoDiaAtivo: ultimo.toISOString().slice(0, 10),
    };
  }

  async calcular(
    usuarioId: number,
    bloqueiosTotais = OFENSIVA_BLOQUEIOS_MAX,
  ): Promise<OfensivaResumo> {
    const hoje = startOfDay(new Date());
    const inicio = addDays(hoje, -400);

    const registros = await this.prisma.registroEstudo.findMany({
      where: { creatorId: usuarioId, dataEstudo: { gte: inicio } },
      orderBy: { dataEstudo: 'asc' },
      select: { dataEstudo: true, tipoRegistro: true },
    });

    return this.calcularOfensivaComRecuperacao({
      registrosAsc: registros,
      bloqueiosTotais,
    });
  }

  async recalcularEAtualizar(usuarioId: number): Promise<OfensivaResumo> {
    const resumo = await this.calcular(usuarioId, OFENSIVA_BLOQUEIOS_MAX);

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
