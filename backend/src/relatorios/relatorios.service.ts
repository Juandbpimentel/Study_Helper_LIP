import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StatusRevisao } from '@prisma/client';
import { startOfDay, addDays } from '@/common/utils/date.utils';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(usuarioId: number) {
    const hoje = startOfDay(new Date());
    const amanha = addDays(hoje, 1);

    const [
      registrosAgg,
      revisoesConcluidas,
      revisoesPendentes,
      revisoesAtrasadas,
    ] = await Promise.all([
      this.prisma.registroEstudo.aggregate({
        where: { creatorId: usuarioId },
        _count: { _all: true },
        _sum: { tempoDedicado: true },
      }),
      this.prisma.revisaoProgramada.count({
        where: { creatorId: usuarioId, statusRevisao: StatusRevisao.Concluida },
      }),
      this.prisma.revisaoProgramada.count({
        where: {
          creatorId: usuarioId,
          statusRevisao: { in: [StatusRevisao.Pendente, StatusRevisao.Adiada] },
        },
      }),
      this.prisma.revisaoProgramada.count({
        where: { creatorId: usuarioId, statusRevisao: StatusRevisao.Atrasada },
      }),
    ]);

    const revisoesDoDia = await this.prisma.revisaoProgramada.count({
      where: {
        creatorId: usuarioId,
        dataRevisao: { gte: hoje, lt: amanha },
        statusRevisao: { in: [StatusRevisao.Pendente, StatusRevisao.Adiada] },
      },
    });

    const desempenhoPorTema = await this.calcularTopTemas(usuarioId);

    return {
      totalEstudos: registrosAgg._count._all,
      tempoTotalEstudado: registrosAgg._sum.tempoDedicado ?? 0,
      revisoesConcluidas,
      revisoesPendentes,
      revisoesAtrasadas,
      revisoesHoje: revisoesDoDia,
      desempenhoPorTema,
    };
  }

  private async calcularTopTemas(usuarioId: number) {
    const registros = await this.prisma.registroEstudo.findMany({
      where: { creatorId: usuarioId, temaId: { not: null } },
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
      .slice(0, 5);

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
}
