import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, StatusRevisao } from '@prisma/client';
import { formatISODate, startOfDay } from '@/common/utils/date.utils';

export type RegistroStats = {
  totalRegistros: number;
  tempoTotalMin: number;
  diasComAtividade: number;
  porTipo: Array<{
    tipoRegistro: string;
    quantidade: number;
    tempoTotal: number;
  }>;
};

export type RevisaoStats = {
  concluidas: number;
  pendentes: number;
  atrasadas: number;
  expiradas: number;
};

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegistroStats(
    where: Prisma.RegistroEstudoWhereInput,
  ): Promise<RegistroStats> {
    const [agg, porTipo, diasComAtividade] = await Promise.all([
      this.prisma.registroEstudo.aggregate({
        where,
        _count: { _all: true },
        _sum: { tempoDedicado: true },
      }),
      this.prisma.registroEstudo.groupBy({
        by: ['tipoRegistro'],
        where,
        _count: { _all: true },
        _sum: { tempoDedicado: true },
      }),
      this.countDiasComAtividade(where),
    ]);

    return {
      totalRegistros: agg._count._all,
      tempoTotalMin: agg._sum.tempoDedicado ?? 0,
      diasComAtividade,
      porTipo: porTipo.map((r) => ({
        tipoRegistro: String(r.tipoRegistro),
        quantidade: r._count._all,
        tempoTotal: r._sum.tempoDedicado ?? 0,
      })),
    };
  }

  async getRevisaoStats(
    whereBase: Prisma.RevisaoProgramadaWhereInput,
  ): Promise<RevisaoStats> {
    const [concluidas, pendentes, atrasadas, expiradas] = await Promise.all([
      this.prisma.revisaoProgramada.count({
        where: { ...whereBase, statusRevisao: StatusRevisao.Concluida },
      }),
      this.prisma.revisaoProgramada.count({
        where: {
          ...whereBase,
          statusRevisao: { in: [StatusRevisao.Pendente, StatusRevisao.Adiada] },
        },
      }),
      this.prisma.revisaoProgramada.count({
        where: { ...whereBase, statusRevisao: StatusRevisao.Atrasada },
      }),
      this.prisma.revisaoProgramada.count({
        where: { ...whereBase, statusRevisao: StatusRevisao.Expirada },
      }),
    ]);

    return { concluidas, pendentes, atrasadas, expiradas };
  }

  async getTopTemas(whereBase: Prisma.RegistroEstudoWhereInput, limit = 5) {
    const registros = await this.prisma.registroEstudo.findMany({
      where: { ...whereBase, temaId: { not: null } },
      select: { temaId: true, tempoDedicado: true },
    });

    const acumulado = new Map<
      number,
      { temaId: number; quantidadeEstudos: number; tempoTotal: number }
    >();

    for (const registro of registros) {
      if (registro.temaId === null) continue;
      const atual = acumulado.get(registro.temaId);
      if (atual) {
        atual.quantidadeEstudos += 1;
        atual.tempoTotal += registro.tempoDedicado;
        continue;
      }
      acumulado.set(registro.temaId, {
        temaId: registro.temaId,
        quantidadeEstudos: 1,
        tempoTotal: registro.tempoDedicado,
      });
    }

    const ordenados = Array.from(acumulado.values())
      .sort((a, b) => b.quantidadeEstudos - a.quantidadeEstudos)
      .slice(0, limit);

    const temas = ordenados.length
      ? await this.prisma.temaDeEstudo.findMany({
          where: { id: { in: ordenados.map((item) => item.temaId) } },
          select: { id: true, tema: true, cor: true },
        })
      : [];

    const temaMap = new Map(temas.map((tema) => [tema.id, tema]));

    return ordenados.map((item) => {
      const tema = temaMap.get(item.temaId);
      return {
        temaId: item.temaId,
        tema: tema?.tema ?? 'Tema removido',
        cor: tema?.cor ?? null,
        quantidadeEstudos: item.quantidadeEstudos,
        tempoTotal: item.tempoTotal,
      };
    });
  }

  private async countDiasComAtividade(
    where: Prisma.RegistroEstudoWhereInput,
  ): Promise<number> {
    const registros = await this.prisma.registroEstudo.findMany({
      where,
      select: { dataEstudo: true },
    });

    const dias = new Set<string>();
    for (const r of registros) {
      dias.add(formatISODate(startOfDay(r.dataEstudo)));
    }

    return dias.size;
  }
}
