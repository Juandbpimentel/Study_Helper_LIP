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
import { MetricsService } from './services/metrics.service';
import { OfensivaService } from '@/ofensiva/ofensiva.service';
import type { PdfGenerateRequest } from '@/integrations/pdf/pdf.service';

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

  async buildResumoPdfRequest(
    usuarioId: number,
    query?: ResumoRelatorioQueryDto,
  ): Promise<PdfGenerateRequest> {
    const resumo = await this.resumo(usuarioId, query);

    const dataAtual = formatISODate(startOfDay(new Date()));
    const dataInicial = resumo.periodo.dataInicial;
    const dataFinal = resumo.periodo.dataFinal;

    const periodoLabel =
      dataInicial || dataFinal
        ? `${dataInicial ?? '...'}_a_${dataFinal ?? '...'}`
        : 'GERAL';

    const temaLabel =
      typeof query?.temaId === 'number' ? `_tema_${query.temaId}` : '';

    const fileName = `relatorio_resumo_${periodoLabel}${temaLabel}`;

    const fmtNumber = (n: number): string => {
      if (!Number.isFinite(n)) return '0';
      if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
      return n.toFixed(2);
    };

    const registrosLabels = resumo.registrosPorTipo.map((r) => r.tipoRegistro);
    const registrosData = resumo.registrosPorTipo.map((r) => r.quantidade);

    return {
      templateName: 'builder',
      fileName,
      data: {
        layout: {
          margemCima: 10,
          margemBaixo: 10,
          margemEsquerda: 12,
          margemDireita: 12,
        },
        secoes: [
          {
            componente: 'header_corporativo',
            margemInferior: 20,
            empresaNome: 'Study Helper',
            documentoTitulo: 'RELATÓRIO – RESUMO CONSOLIDADO',
            referencia: periodoLabel,
            dataAtual,
          },
          {
            componente: 'info_grid',
            margemInferior: 20,
            tituloSecao: 'KPIs',
            itens: [
              { label: 'Total estudos', valor: String(resumo.totalEstudos) },
              {
                label: 'Tempo total (min)',
                valor: String(resumo.tempoTotalEstudado),
              },
              { label: 'Dias com estudo', valor: String(resumo.diasComEstudo) },
              {
                label: 'Média min/dia ativo',
                valor: fmtNumber(resumo.tempoMedioPorDiaAtivo),
              },
              { label: 'Revisões hoje', valor: String(resumo.revisoesHoje) },
              {
                label: 'Ofensiva atual (dias)',
                valor: String(resumo.ofensiva.atual),
              },
            ],
          },
          {
            componente: 'info_grid',
            margemInferior: 20,
            tituloSecao: 'Revisões',
            itens: [
              {
                label: 'Concluídas',
                valor: String(resumo.revisoesConcluidas),
              },
              { label: 'Pendentes', valor: String(resumo.revisoesPendentes) },
              { label: 'Atrasadas', valor: String(resumo.revisoesAtrasadas) },
              { label: 'Expiradas', valor: String(resumo.revisoesExpiradas) },
            ],
          },
          {
            componente: 'grafico',
            margemInferior: 20,
            titulo: 'Registros por tipo',
            descricao:
              'Distribuição de registros dentro do período selecionado.',
            config: {
              type: 'bar',
              data: {
                labels: registrosLabels,
                datasets: [
                  {
                    label: 'Quantidade',
                    data: registrosData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  },
                ],
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
              },
            },
          },
          {
            componente: 'tabela',
            margemInferior: 10,
            titulo: 'Top temas (por quantidade de estudos)',
            colunas: ['Tema', 'Qtd estudos', 'Tempo total (min)'],
            linhas: resumo.desempenhoPorTema.map((t) => [
              String(t.tema),
              String(t.quantidadeEstudos),
              String(t.tempoTotal),
            ]),
          },
        ],
      },
    };
  }
}
