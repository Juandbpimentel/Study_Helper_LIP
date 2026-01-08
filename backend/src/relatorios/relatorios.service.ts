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
import { MetricsService } from '@/common/services/metrics.service';
import { OfensivaService } from '@/ofensiva/ofensiva.service';

@Injectable()
export class RelatoriosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly ofensivaService: OfensivaService,
  ) {}

  async resumo(usuarioId: number, query?: ResumoRelatorioQueryDto) {
    const hoje = startOfDay(new Date());
    const amanha = addDays(hoje, 1);

    const ofensiva = await this.ofensivaService.calcular(usuarioId);

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

    const [registroStats, revisaoStats] = await Promise.all([
      this.metrics.getRegistroStats(whereRegistros),
      this.metrics.getRevisaoStats(whereRevisoes),
    ]);

    const revisoesDoDia = dentroDoPeriodoHoje
      ? await this.prisma.revisaoProgramada.count({
          where: {
            creatorId: usuarioId,
            ...(temaId ? { registroOrigem: { temaId } } : {}),
            dataRevisao: { gte: hoje, lt: amanha },
            statusRevisao: {
              in: [StatusRevisao.Pendente, StatusRevisao.Adiada],
            },
          },
        })
      : 0;

    const diasComEstudo = registroStats.diasComAtividade;
    const tempoTotal = registroStats.tempoTotalMin;
    const tempoMedioPorDiaAtivo =
      diasComEstudo > 0 ? tempoTotal / diasComEstudo : 0;

    const desempenhoPorTema = await this.metrics.getTopTemas(whereRegistros);

    return {
      periodo: {
        dataInicial: inicioPeriodo ? formatISODate(inicioPeriodo) : null,
        dataFinal: dataFinal ? formatISODate(startOfDay(dataFinal)) : null,
      },
      ofensiva,
      totalEstudos: registroStats.totalRegistros,
      tempoTotalEstudado: tempoTotal,
      diasComEstudo,
      tempoMedioPorDiaAtivo,
      registrosPorTipo: registroStats.porTipo,
      revisoesConcluidas: revisaoStats.concluidas,
      revisoesPendentes: revisaoStats.pendentes,
      revisoesAtrasadas: revisaoStats.atrasadas,
      revisoesExpiradas: revisaoStats.expiradas,
      revisoesHoje: revisoesDoDia,
      desempenhoPorTema,
    };
  }
}
