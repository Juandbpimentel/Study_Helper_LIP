import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, StatusRevisao } from '@prisma/client';
import {
  addDays,
  formatISODate,
  parseISODate,
  startOfDay,
} from '@/common/utils/date.utils';
import { ResumoRelatorioQueryDto } from './dto/resumo-query.dto';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(usuarioId: number, query?: ResumoRelatorioQueryDto) {
    const hoje = startOfDay(new Date());
    const amanha = addDays(hoje, 1);

    const dataInicial = query?.dataInicial
      ? parseISODate(query.dataInicial)
      : null;
    const dataFinal = query?.dataFinal ? parseISODate(query.dataFinal) : null;

    if (query?.dataInicial && !dataInicial)
      throw new BadRequestException('Data inicial inválida');
    if (query?.dataFinal && !dataFinal)
      throw new BadRequestException('Data final inválida');

    const inicioPeriodo = dataInicial ? startOfDay(dataInicial) : null;
    const fimPeriodoExclusive = dataFinal
      ? addDays(startOfDay(dataFinal), 1)
      : null;

    const temaId = typeof query?.temaId === 'number' ? query.temaId : null;
    if (temaId) {
      const tema = await this.prisma.temaDeEstudo.findFirst({
        where: { id: temaId, creatorId: usuarioId },
        select: { id: true },
      });
      if (!tema)
        throw new NotFoundException('Tema não encontrado para o usuário');
    }

    const whereRegistros: Prisma.RegistroEstudoWhereInput = {
      creatorId: usuarioId,
      ...(temaId ? { temaId } : {}),
      ...(inicioPeriodo || fimPeriodoExclusive
        ? {
            dataEstudo: {
              ...(inicioPeriodo ? { gte: inicioPeriodo } : {}),
              ...(fimPeriodoExclusive ? { lt: fimPeriodoExclusive } : {}),
            },
          }
        : {}),
    };

    const whereRevisoes: Prisma.RevisaoProgramadaWhereInput = {
      creatorId: usuarioId,
      ...(temaId ? { registroOrigem: { temaId } } : {}),
      ...(inicioPeriodo || fimPeriodoExclusive
        ? {
            dataRevisao: {
              ...(inicioPeriodo ? { gte: inicioPeriodo } : {}),
              ...(fimPeriodoExclusive ? { lt: fimPeriodoExclusive } : {}),
            },
          }
        : {}),
    };

    const dentroDoPeriodoHoje =
      (!inicioPeriodo || hoje >= inicioPeriodo) &&
      (!fimPeriodoExclusive || hoje < fimPeriodoExclusive);

    const [
      registrosAgg,
      registrosPorTipo,
      revisoesConcluidas,
      revisoesPendentes,
      revisoesAtrasadas,
      revisoesExpiradas,
    ] = await Promise.all([
      this.prisma.registroEstudo.aggregate({
        where: whereRegistros,
        _count: { _all: true },
        _sum: { tempoDedicado: true },
      }),
      this.prisma.registroEstudo.groupBy({
        by: ['tipoRegistro'],
        where: whereRegistros,
        _count: { _all: true },
        _sum: { tempoDedicado: true },
      }),
      this.prisma.revisaoProgramada.count({
        where: { ...whereRevisoes, statusRevisao: StatusRevisao.Concluida },
      }),
      this.prisma.revisaoProgramada.count({
        where: {
          ...whereRevisoes,
          statusRevisao: { in: [StatusRevisao.Pendente, StatusRevisao.Adiada] },
        },
      }),
      this.prisma.revisaoProgramada.count({
        where: { ...whereRevisoes, statusRevisao: StatusRevisao.Atrasada },
      }),
      this.prisma.revisaoProgramada.count({
        where: { ...whereRevisoes, statusRevisao: StatusRevisao.Expirada },
      }),
    ]);

    const revisoesDoDia = dentroDoPeriodoHoje
      ? await this.prisma.revisaoProgramada.count({
          where: {
            creatorId: usuarioId,
            dataRevisao: { gte: hoje, lt: amanha },
            statusRevisao: {
              in: [StatusRevisao.Pendente, StatusRevisao.Adiada],
            },
          },
        })
      : 0;

    const diasComEstudo = await this.calcularDiasComEstudo(whereRegistros);
    const tempoTotal = registrosAgg._sum.tempoDedicado ?? 0;
    const tempoMedioPorDiaAtivo =
      diasComEstudo > 0 ? tempoTotal / diasComEstudo : 0;

    const desempenhoPorTema = await this.calcularTopTemas(whereRegistros);

    const registrosPorTipoFormatado = registrosPorTipo.map((r) => ({
      tipoRegistro: r.tipoRegistro,
      quantidade: r._count._all,
      tempoTotal: r._sum.tempoDedicado ?? 0,
    }));

    return {
      periodo: {
        dataInicial: inicioPeriodo ? formatISODate(inicioPeriodo) : null,
        dataFinal: dataFinal ? formatISODate(startOfDay(dataFinal)) : null,
      },
      totalEstudos: registrosAgg._count._all,
      tempoTotalEstudado: tempoTotal,
      diasComEstudo,
      tempoMedioPorDiaAtivo,
      registrosPorTipo: registrosPorTipoFormatado,
      revisoesConcluidas,
      revisoesPendentes,
      revisoesAtrasadas,
      revisoesExpiradas,
      revisoesHoje: revisoesDoDia,
      desempenhoPorTema,
    };
  }

  private async calcularDiasComEstudo(where: Prisma.RegistroEstudoWhereInput) {
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

  private async calcularTopTemas(whereBase: Prisma.RegistroEstudoWhereInput) {
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
