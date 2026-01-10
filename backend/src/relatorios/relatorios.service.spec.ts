import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { MetricsService } from '@/common/services/metrics.service';
import type { OfensivaService } from '@/ofensiva/ofensiva.service';
import type { ResumoRelatorioQueryDto } from './dto/resumo-query.dto';
import type { Prisma } from '@prisma/client';
import { StatusRevisao } from '@prisma/client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

describe('RelatoriosService', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('buildResumoPdfRequest: referencia usa 00:00 a 23:59 no período', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T16:30:00.000Z'));

    const prisma: PrismaService = {} as unknown as PrismaService;
    const metrics: MetricsService = {} as unknown as MetricsService;
    const ofensiva: OfensivaService = {} as unknown as OfensivaService;

    const service: RelatoriosService = new RelatoriosService(
      prisma,
      metrics,
      ofensiva,
    );

    const resumo: Awaited<ReturnType<RelatoriosService['resumo']>> = {
      periodo: { dataInicial: null, dataFinal: null },
      ofensiva: {
        atual: 0,
        bloqueiosTotais: 0,
        bloqueiosUsados: 0,
        bloqueiosRestantes: 0,
        ultimoDiaAtivo: null,
      },
      totalEstudos: 0,
      tempoTotalEstudado: 0,
      diasComEstudo: 0,
      tempoMedioPorDiaAtivo: 0,
      registrosPorTipo: [],
      revisoesConcluidas: 0,
      revisoesPendentes: 0,
      revisoesAtrasadas: 0,
      revisoesExpiradas: 0,
      revisoesHoje: 0,
      desempenhoPorTema: [],
    };

    jest.spyOn(service, 'resumo').mockResolvedValue(resumo);

    await Promise.resolve<unknown>(
      service.buildResumoPdfRequest(1, {
        dataInicial: '2026-11-01',
        dataFinal: '2026-11-30',
      }) as unknown,
    ).then((reqUnknown) => {
      if (!isRecord(reqUnknown)) throw new Error('request inválido');
      const dataUnknown = reqUnknown['data'];
      if (!isRecord(dataUnknown)) throw new Error('data inválido');

      const secoesRaw = dataUnknown['secoes'];
      if (!Array.isArray(secoesRaw)) {
        throw new Error('Seções do PDF não encontradas');
      }

      const header = secoesRaw.find((secao) => {
        if (!isRecord(secao)) return false;
        return secao['componente'] === 'header_corporativo';
      });

      if (!isRecord(header)) {
        throw new Error('Seção header_corporativo não encontrada');
      }

      const referencia = header['referencia'];
      if (!isString(referencia)) throw new Error('referencia inválida');

      expect(referencia).toBe('1/11/2026 00:00 a 30/11/2026 23:59');
    });
  });

  it('resumo: lança BadRequest quando dataInicial é inválida', async () => {
    const prisma = {} as unknown as PrismaService;

    const metrics: Pick<
      MetricsService,
      'getRegistroStats' | 'getRevisaoStats' | 'getTopTemas'
    > = {
      getRegistroStats: jest.fn(),
      getRevisaoStats: jest.fn(),
      getTopTemas: jest.fn(),
    };

    const ofensiva: Pick<OfensivaService, 'calcular'> = {
      calcular: jest.fn().mockResolvedValue({
        atual: 0,
        bloqueiosTotais: 2,
        bloqueiosUsados: 0,
        bloqueiosRestantes: 2,
        ultimoDiaAtivo: null,
      }),
    };

    const service = new RelatoriosService(
      prisma,
      metrics as MetricsService,
      ofensiva as OfensivaService,
    );

    const query: ResumoRelatorioQueryDto = { dataInicial: 'nope' };

    await expect(service.resumo(1, query)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('resumo: lança BadRequest quando dataFinal é inválida', async () => {
    const prisma = {} as unknown as PrismaService;

    const metrics: Pick<
      MetricsService,
      'getRegistroStats' | 'getRevisaoStats' | 'getTopTemas'
    > = {
      getRegistroStats: jest.fn(),
      getRevisaoStats: jest.fn(),
      getTopTemas: jest.fn(),
    };

    const ofensiva: Pick<OfensivaService, 'calcular'> = {
      calcular: jest.fn().mockResolvedValue({
        atual: 0,
        bloqueiosTotais: 2,
        bloqueiosUsados: 0,
        bloqueiosRestantes: 2,
        ultimoDiaAtivo: null,
      }),
    };

    const service = new RelatoriosService(
      prisma,
      metrics as MetricsService,
      ofensiva as OfensivaService,
    );

    const query: ResumoRelatorioQueryDto = { dataFinal: 'nope' };

    await expect(service.resumo(1, query)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('resumo: quando temaId não pertence ao usuário lança NotFound', async () => {
    const temaFindFirst = jest
      .fn<Promise<{ id: number } | null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
      .mockResolvedValue(null);

    const prisma = {
      temaDeEstudo: { findFirst: temaFindFirst },
      revisaoProgramada: { count: jest.fn() },
    } as unknown as PrismaService;

    const metrics: Pick<
      MetricsService,
      'getRegistroStats' | 'getRevisaoStats' | 'getTopTemas'
    > = {
      getRegistroStats: jest.fn(),
      getRevisaoStats: jest.fn(),
      getTopTemas: jest.fn(),
    };

    const ofensiva: Pick<OfensivaService, 'calcular'> = {
      calcular: jest.fn().mockResolvedValue({
        atual: 0,
        bloqueiosTotais: 2,
        bloqueiosUsados: 0,
        bloqueiosRestantes: 2,
        ultimoDiaAtivo: null,
      }),
    };

    const service = new RelatoriosService(
      prisma,
      metrics as MetricsService,
      ofensiva as OfensivaService,
    );

    await expect(service.resumo(1, { temaId: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(temaFindFirst).toHaveBeenCalledTimes(1);
  });

  it('resumo: fluxo feliz sem período e sem temaId', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const revisaoCount = jest
      .fn<Promise<number>, [Prisma.RevisaoProgramadaCountArgs]>()
      .mockResolvedValue(3);

    const prisma = {
      temaDeEstudo: { findFirst: jest.fn() },
      revisaoProgramada: { count: revisaoCount },
    } as unknown as PrismaService;

    const getRegistroStats = jest
      .fn<
        Promise<{
          totalRegistros: number;
          tempoTotalMin: number;
          diasComAtividade: number;
          porTipo: Array<{
            tipoRegistro: string;
            quantidade: number;
            tempoTotal: number;
          }>;
        }>,
        [Prisma.RegistroEstudoWhereInput]
      >()
      .mockResolvedValue({
        totalRegistros: 10,
        tempoTotalMin: 120,
        diasComAtividade: 4,
        porTipo: [
          { tipoRegistro: 'EstudoDeTema', quantidade: 8, tempoTotal: 100 },
          { tipoRegistro: 'Revisao', quantidade: 2, tempoTotal: 20 },
        ],
      });

    const getRevisaoStats = jest
      .fn<
        Promise<{
          concluidas: number;
          pendentes: number;
          atrasadas: number;
          expiradas: number;
        }>,
        [Prisma.RevisaoProgramadaWhereInput]
      >()
      .mockResolvedValue({
        concluidas: 2,
        pendentes: 5,
        atrasadas: 1,
        expiradas: 0,
      });

    const getTopTemas = jest
      .fn<
        Promise<
          Array<{
            temaId: number;
            tema: string;
            cor: string | null;
            quantidadeEstudos: number;
            tempoTotal: number;
          }>
        >,
        [Prisma.RegistroEstudoWhereInput]
      >()
      .mockResolvedValue([
        {
          temaId: 1,
          tema: 'Tema A',
          cor: '#000000',
          quantidadeEstudos: 5,
          tempoTotal: 60,
        },
      ]);

    const metrics: Pick<
      MetricsService,
      'getRegistroStats' | 'getRevisaoStats' | 'getTopTemas'
    > = {
      getRegistroStats,
      getRevisaoStats,
      getTopTemas,
    };

    const ofensiva: Pick<OfensivaService, 'calcular'> = {
      calcular: jest.fn().mockResolvedValue({
        atual: 2,
        bloqueiosTotais: 2,
        bloqueiosUsados: 0,
        bloqueiosRestantes: 2,
        ultimoDiaAtivo: '2026-01-08T00:00:00.000Z',
      }),
    };

    const service = new RelatoriosService(
      prisma,
      metrics as MetricsService,
      ofensiva as OfensivaService,
    );

    const result = await service.resumo(7);

    expect(result.totalEstudos).toBe(10);
    expect(result.tempoTotalEstudado).toBe(120);
    expect(result.diasComEstudo).toBe(4);
    expect(result.tempoMedioPorDiaAtivo).toBe(30);
    expect(result.revisoesHoje).toBe(3);
    expect(result.revisoesPendentes).toBe(5);
    expect(result.desempenhoPorTema.length).toBe(1);

    // sanity: count de hoje foi chamado com filtros de pendentes/adiadas
    expect(revisaoCount).toHaveBeenCalledTimes(1);
    const countArgs = revisaoCount.mock.calls[0]?.[0];
    if (!countArgs) throw new Error('revisaoProgramada.count não foi chamado');
    expect(countArgs.where?.statusRevisao).toEqual({
      in: [StatusRevisao.Pendente, StatusRevisao.Adiada],
    });
  });

  it('resumo: quando hoje está fora do período, revisoesHoje=0', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const revisaoCount = jest
      .fn<Promise<number>, [Prisma.RevisaoProgramadaCountArgs]>()
      .mockResolvedValue(99);

    const prisma = {
      temaDeEstudo: { findFirst: jest.fn() },
      revisaoProgramada: { count: revisaoCount },
    } as unknown as PrismaService;

    const metrics: Pick<
      MetricsService,
      'getRegistroStats' | 'getRevisaoStats' | 'getTopTemas'
    > = {
      getRegistroStats: jest.fn().mockResolvedValue({
        totalRegistros: 0,
        tempoTotalMin: 0,
        diasComAtividade: 0,
        porTipo: [],
      }),
      getRevisaoStats: jest.fn().mockResolvedValue({
        concluidas: 0,
        pendentes: 0,
        atrasadas: 0,
        expiradas: 0,
      }),
      getTopTemas: jest.fn().mockResolvedValue([]),
    };

    const ofensiva: Pick<OfensivaService, 'calcular'> = {
      calcular: jest.fn().mockResolvedValue({
        atual: 0,
        bloqueiosTotais: 2,
        bloqueiosUsados: 0,
        bloqueiosRestantes: 2,
        ultimoDiaAtivo: null,
      }),
    };

    const service = new RelatoriosService(
      prisma,
      metrics as MetricsService,
      ofensiva as OfensivaService,
    );

    // período totalmente no passado
    const result = await service.resumo(7, {
      dataInicial: '2025-12-01',
      dataFinal: '2025-12-31',
    });

    expect(result.revisoesHoje).toBe(0);
    expect(revisaoCount).toHaveBeenCalledTimes(0);
  });
});
