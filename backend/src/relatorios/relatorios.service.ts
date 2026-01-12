import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, StatusRevisao, TipoRegistro } from '@prisma/client';
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

function formatUtcPtBrDateTime(date: Date): string {
  const dd = String(date.getUTCDate());
  const mm = String(date.getUTCMonth() + 1);
  const yyyy = String(date.getUTCFullYear());
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatUtcFileDate(date: Date): string {
  // YYYY-MM-DD (seguro para nome de arquivo)
  return startOfDay(date).toISOString().slice(0, 10);
}

function withUtcTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

type ChartType = 'line' | 'bar' | 'doughnut' | 'pie';

type ChartDataset = {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  tension?: number;
  fill?: boolean;
};

type ChartConfig<TType extends ChartType> = {
  type: TType;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: Record<string, unknown>;
};

const chartConfig = <TType extends ChartType>(config: ChartConfig<TType>) =>
  config;

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

    const [registroStats, revisaoStats, registrosPeriodo] = await Promise.all([
      this.metrics.getRegistroStats(whereRegistros),
      this.metrics.getRevisaoStats(whereRevisoes),
      this.prisma.registroEstudo.findMany({
        where: whereRegistros,
        select: {
          tempoDedicado: true,
          dataEstudo: true,
          tipoRegistro: true,
          temaId: true,
          tema: { select: { tema: true, cor: true } },
        },
      }),
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

    const tempoMedioPorEstudo =
      registroStats.totalRegistros > 0
        ? tempoTotal / registroStats.totalRegistros
        : 0;

    const desempenhoPorTema = await this.metrics.getTopTemas(whereRegistros);

    const revisoesConcluidasPorRegistro = registrosPeriodo.filter(
      (r) => r.tipoRegistro === TipoRegistro.Revisao,
    ).length;

    const seriesDiariaMap = new Map<string, number>();
    const seriesTemaPorDia = new Map<
      string,
      Map<number | null, { tema: string; cor: string | null; minutos: number }>
    >();
    const temaAggregates = new Map<
      number | null,
      {
        temaId: number | null;
        tema: string;
        cor: string | null;
        quantidadeEstudos: number;
        revisoesConcluidas: number;
        minutos: number;
      }
    >();

    for (const registro of registrosPeriodo) {
      const dia = formatISODate(startOfDay(registro.dataEstudo));
      const minutos = registro.tempoDedicado ?? 0;
      seriesDiariaMap.set(dia, (seriesDiariaMap.get(dia) ?? 0) + minutos);

      const temaDoDiaMap = seriesTemaPorDia.get(dia) ?? new Map();
      const temaKey = registro.temaId ?? null;
      const temaNome = registro.tema?.tema ?? 'Sem tema';
      const atualTema = temaDoDiaMap.get(temaKey) ?? {
        tema: temaNome,
        cor: registro.tema?.cor ?? null,
        minutos: 0,
      };
      atualTema.minutos += minutos;
      temaDoDiaMap.set(temaKey, atualTema);
      seriesTemaPorDia.set(dia, temaDoDiaMap);

      const key = registro.temaId ?? null;
      const temaInfo = temaAggregates.get(key) ?? {
        temaId: key,
        tema: registro.tema?.tema ?? 'Sem tema',
        cor: registro.tema?.cor ?? null,
        quantidadeEstudos: 0,
        revisoesConcluidas: 0,
        minutos: 0,
      };

      temaInfo.quantidadeEstudos += 1;
      temaInfo.minutos += minutos;
      if (registro.tipoRegistro === TipoRegistro.Revisao) {
        temaInfo.revisoesConcluidas += 1;
      }

      temaAggregates.set(key, temaInfo);
    }

    const seriesDiariaDetalhada = Array.from(seriesDiariaMap.entries())
      .map(([data, minutos]) => {
        const d = new Date(data);
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const temasDoDia = seriesTemaPorDia.get(data);
        let temaLabel = '';
        let temasDetalhe: Array<{
          temaId: number | null;
          tema: string;
          cor: string | null;
          minutos: number;
        }> = [];
        if (temasDoDia && temasDoDia.size) {
          const sorted = Array.from(temasDoDia.entries()).sort(
            (a, b) => b[1].minutos - a[1].minutos,
          );
          const top = sorted[0]?.[1];
          temaLabel = top ? ` - ${top.tema}` : '';
          temasDetalhe = sorted.map(([temaId, info]) => ({
            temaId,
            tema: info.tema,
            cor: info.cor,
            minutos: info.minutos,
          }));
        }
        return {
          data,
          label: `${dd}/${mm}${temaLabel}`,
          minutos,
          temas: temasDetalhe,
        };
      })
      .sort((a, b) => a.data.localeCompare(b.data));

    const seriesDiaria = seriesDiariaDetalhada.map((s) => ({
      data: s.data,
      label: s.label,
      minutos: s.minutos,
    }));

    const estudosPorTema = Array.from(temaAggregates.values())
      .filter((t) => t.minutos > 0 || t.revisoesConcluidas > 0)
      .sort((a, b) => b.minutos - a.minutos);

    const hojeStart = startOfDay(new Date());

    let inicioPeriodoEfeito = inicioPeriodo ?? null;
    let fimPeriodoEfeito = fimPeriodoExclusive
      ? addDays(fimPeriodoExclusive, -1)
      : hojeStart;

    if (!inicioPeriodo && !fimPeriodoExclusive) {
      const todasDatas = registrosPeriodo
        .map((r) => startOfDay(r.dataEstudo).getTime())
        .filter((v) => Number.isFinite(v));

      if (todasDatas.length) {
        inicioPeriodoEfeito = startOfDay(new Date(Math.min(...todasDatas)));
        fimPeriodoEfeito = startOfDay(new Date(Math.max(...todasDatas)));
      } else {
        inicioPeriodoEfeito = addDays(hojeStart, -6);
      }
    }

    if (!inicioPeriodoEfeito) inicioPeriodoEfeito = hojeStart;

    const periodoDias = Math.max(
      1,
      Math.floor(
        (startOfDay(fimPeriodoEfeito).getTime() -
          startOfDay(inicioPeriodoEfeito).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1,
    );

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
      tempoMedioPorEstudo,
      registrosPorTipo: registroStats.porTipo,
      revisoesConcluidasPorRegistro,
      revisoesConcluidas: revisaoStats.concluidas,
      revisoesPendentes: revisaoStats.pendentes,
      revisoesAtrasadas: revisaoStats.atrasadas,
      revisoesExpiradas: revisaoStats.expiradas,
      revisoesHoje: revisoesDoDia,
      desempenhoPorTema,
      seriesDiaria,
      seriesDiariaTemas: seriesDiariaDetalhada,
      estudosPorTema,
      periodoDias,
    };
  }

  async buildResumoPdfRequest(
    usuarioId: number,
    query?: ResumoRelatorioQueryDto,
  ): Promise<PdfGenerateRequest> {
    const resumo = await this.resumo(usuarioId, query);

    const now = new Date();
    const dataAtual = formatUtcPtBrDateTime(now);

    const dataInicialRaw = query?.dataInicial
      ? parseISODate(query.dataInicial)
      : null;
    const dataFinalRaw = query?.dataFinal
      ? parseISODate(query.dataFinal)
      : null;

    // Para referência humana: mostrar em pt-BR com HH:mm, mas com horários fixos no período:
    // início 00:00 e fim 23:59 (sem usar o horário atual do momento do relatório).
    const dataInicialRef = dataInicialRaw
      ? withUtcTime(startOfDay(dataInicialRaw), 0, 0)
      : null;
    const dataFinalRef = dataFinalRaw
      ? withUtcTime(startOfDay(dataFinalRaw), 23, 59)
      : null;

    const periodoRefLabel =
      dataInicialRef || dataFinalRef
        ? `${dataInicialRef ? formatUtcPtBrDateTime(dataInicialRef) : '...'} a ${
            dataFinalRef ? formatUtcPtBrDateTime(dataFinalRef) : '...'
          }`
        : 'GERAL';

    // Para nome de arquivo: manter apenas YYYY-MM-DD (sem ':' e sem timezone).
    const periodoFileLabel =
      dataInicialRaw || dataFinalRaw
        ? `${dataInicialRaw ? formatUtcFileDate(dataInicialRaw) : '...'}_a_${
            dataFinalRaw ? formatUtcFileDate(dataFinalRaw) : '...'
          }`
        : 'GERAL';

    const temaLabel =
      typeof query?.temaId === 'number' ? `_tema_${query.temaId}` : '';

    const fileName = `relatorio_resumo_${periodoFileLabel}${temaLabel}`;

    const fmtNumber = (n: number): string => {
      if (!Number.isFinite(n)) return '0';
      if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
      return n.toFixed(2);
    };

    const registrosLabels = resumo.registrosPorTipo.map((r) => r.tipoRegistro);
    const registrosData = resumo.registrosPorTipo.map((r) => r.quantidade);

    const tempoTotalLabel = `${Math.floor(
      resumo.tempoTotalEstudado / 60,
    )}h ${resumo.tempoTotalEstudado % 60}m`;

    const dailySeriesDetalhe = resumo.seriesDiariaTemas ?? [];
    const dailyLabels = dailySeriesDetalhe.map((d) => d.label);

    const palette = [
      '#6366f1',
      '#22c55e',
      '#f97316',
      '#06b6d4',
      '#f43f5e',
      '#a855f7',
      '#84cc16',
      '#0ea5e9',
    ];

    const keyTema = (id: number | null, nome: string) =>
      id != null ? `id:${id}` : `nome:${nome}`;

    const estudosPorTema = resumo.estudosPorTema ?? [];
    const temasLabels = estudosPorTema.map((t) => t.tema);
    const temasMinutos = estudosPorTema.map((t) => t.minutos);
    const temaColorMap = new Map<string, string>();
    estudosPorTema.forEach((t, idx) => {
      const key = keyTema(t.temaId, t.tema);
      const color = t.cor ?? palette[idx % palette.length];
      temaColorMap.set(key, color);
    });

    // Construir datasets stack por tema para o gráfico diário
    const temaTotals = new Map<string, number>();
    dailySeriesDetalhe.forEach((s) => {
      s.temas?.forEach((t) => {
        const key = keyTema(t.temaId, t.tema);
        temaTotals.set(key, (temaTotals.get(key) ?? 0) + t.minutos);
      });
    });

    const orderedTemaKeys = Array.from(temaTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);

    const dailyThemeMap = new Map(
      dailySeriesDetalhe.map((s) => [
        s.data,
        new Map(
          (s.temas ?? []).map((t) => [keyTema(t.temaId, t.tema), t.minutos]),
        ),
      ]),
    );

    const dailyDatasets = orderedTemaKeys.map((key, idx) => {
      const labelTema =
        estudosPorTema.find((t) => keyTema(t.temaId, t.tema) === key)?.tema ??
        'Tema';
      const color = temaColorMap.get(key) ?? palette[idx % palette.length];
      return {
        label: labelTema,
        data: dailySeriesDetalhe.map((s) => {
          const val = dailyThemeMap.get(s.data)?.get(key) ?? 0;
          return val;
        }),
        backgroundColor: color,
      } as ChartDataset;
    });

    // Paleta para registros por tipo
    const registrosColors = registrosLabels.map(
      (_, idx) => palette[idx % palette.length],
    );

    // Cores dos temas no gráfico de temas
    const temasColors = temasLabels.map(
      (_, idx) =>
        temaColorMap.get(
          keyTema(estudosPorTema[idx]?.temaId ?? null, temasLabels[idx]),
        ) ?? palette[idx % palette.length],
    );

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
            referencia: periodoRefLabel,
            dataAtual,
          },
          {
            componente: 'info_grid',
            margemInferior: 20,
            tituloSecao: 'KPIs',
            itens: [
              { label: 'Total estudos', valor: String(resumo.totalEstudos) },
              {
                label: 'Tempo total',
                valor: tempoTotalLabel,
              },
              { label: 'Dias com estudo', valor: String(resumo.diasComEstudo) },
              {
                label: 'Média min/estudo',
                valor: fmtNumber(resumo.tempoMedioPorEstudo),
              },
              {
                label: 'Média min/dia ativo',
                valor: fmtNumber(resumo.tempoMedioPorDiaAtivo),
              },
              {
                label: 'Ofensiva atual (dias)',
                valor: String(resumo.ofensiva.atual),
              },
              {
                label: 'Bloqueios restantes',
                valor: String(resumo.ofensiva.bloqueiosRestantes),
              },
              { label: 'Período (dias)', valor: String(resumo.periodoDias) },
            ],
          },
          {
            componente: 'info_grid',
            margemInferior: 20,
            tituloSecao: 'Revisões',
            itens: [
              {
                label: 'Concluídas (registros)',
                valor: String(resumo.revisoesConcluidasPorRegistro),
              },
              {
                label: 'Concluídas (programadas)',
                valor: String(resumo.revisoesConcluidas),
              },
              { label: 'Pendentes', valor: String(resumo.revisoesPendentes) },
              { label: 'Atrasadas', valor: String(resumo.revisoesAtrasadas) },
              { label: 'Expiradas', valor: String(resumo.revisoesExpiradas) },
              { label: 'Agendadas hoje', valor: String(resumo.revisoesHoje) },
            ],
          },
          {
            componente: 'grafico',
            margemInferior: 20,
            titulo: 'Tempo por dia (min)',
            descricao:
              'Distribuição de minutos estudados por dia, separado por tema.',
            config: chartConfig({
              type: 'bar',
              data: {
                labels: dailyLabels,
                datasets: dailyDatasets,
              },
              options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: {
                  x: { stacked: true },
                  y: { stacked: true },
                },
              },
            }),
          },
          {
            componente: 'grafico',
            margemInferior: 20,
            titulo: 'Registros por tipo',
            descricao:
              'Distribuição de registros dentro do período selecionado.',
            config: chartConfig({
              type: 'bar',
              data: {
                labels: registrosLabels,
                datasets: [
                  {
                    label: 'Quantidade',
                    data: registrosData,
                    backgroundColor: registrosColors,
                  },
                ],
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
              },
            }),
          },
          {
            componente: 'grafico',
            margemInferior: 20,
            titulo: 'Tempo por tema (min)',
            descricao: 'Distribuição do tempo total estudado por tema.',
            config: chartConfig({
              type: 'bar',
              data: {
                labels: temasLabels,
                datasets: [
                  {
                    label: 'Minutos',
                    data: temasMinutos,
                    backgroundColor: temasColors,
                  },
                ],
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
              },
            }),
          },
          {
            componente: 'tabela',
            margemInferior: 10,
            titulo: 'Temas (tempo e revisões)',
            colunas: [
              'Tema',
              'Estudos',
              'Revisões concluídas',
              'Tempo total (min)',
            ],
            linhas: estudosPorTema.map((t) => [
              String(t.tema),
              String(t.quantidadeEstudos),
              String(t.revisoesConcluidas),
              String(t.minutos),
            ]),
          },
        ],
      },
    };
  }
}
