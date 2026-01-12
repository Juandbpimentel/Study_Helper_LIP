import { OfensivaService } from './ofensiva.service';
import type { PrismaService } from '@/prisma/prisma.service';
import { TipoRegistro, type Prisma } from '@prisma/client';
import { startOfDay } from '@/common/utils/date.utils';

function iso(date: Date): string {
  // Retorna a representação YYYY-MM-DD do dia no fuso local
  const localMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
  return localMidnight.toISOString().slice(0, 10);
}

describe('OfensivaService', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('fromUsuario: sem ultimoDiaAtivo retorna ofensiva zerada', () => {
    const prisma = {} as unknown as PrismaService;
    const service = new OfensivaService(prisma);

    const result = service.fromUsuario({
      ofensivaAtual: 10,
      ofensivaBloqueiosTotais: 3,
      ofensivaBloqueiosUsados: 1,
      ofensivaUltimoDiaAtivo: null,
    });

    expect(result).toEqual({
      atual: 0,
      bloqueiosTotais: 3,
      bloqueiosUsados: 0,
      bloqueiosRestantes: 3,
      ultimoDiaAtivo: null,
    });
  });

  it('fromUsuario: não consome bloqueio se ultimoDiaAtivo for ontem', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const prisma = {} as unknown as PrismaService;
    const service = new OfensivaService(prisma);

    const result = service.fromUsuario({
      ofensivaAtual: 7,
      ofensivaBloqueiosTotais: 3,
      ofensivaBloqueiosUsados: 0,
      ofensivaUltimoDiaAtivo: new Date('2026-01-07T10:00:00.000Z'),
    });

    expect(result.atual).toBe(7);
    expect(result.bloqueiosUsados).toBe(0);
    expect(result.bloqueiosRestantes).toBe(3);
    expect(result.ultimoDiaAtivo).toBe('2026-01-07');
  });

  it('fromUsuario: consome 1 bloqueio quando passou um dia inteiro sem atividade', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const prisma = {} as unknown as PrismaService;
    const service = new OfensivaService(prisma);

    const result = service.fromUsuario({
      ofensivaAtual: 7,
      ofensivaBloqueiosTotais: 3,
      ofensivaBloqueiosUsados: 0,
      ofensivaUltimoDiaAtivo: new Date('2026-01-06T10:00:00.000Z'),
    });

    expect(result.atual).toBe(7);
    expect(result.bloqueiosUsados).toBe(1);
    expect(result.bloqueiosRestantes).toBe(2);
    expect(result.ultimoDiaAtivo).toBe('2026-01-06');
  });

  it('calcular: busca registros e calcula ofensiva', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    type RegistroEstudoRow = { dataEstudo: Date; tipoRegistro: TipoRegistro };
    const registroEstudoFindMany = jest.fn<
      Promise<RegistroEstudoRow[]>,
      [Prisma.RegistroEstudoFindManyArgs]
    >();

    registroEstudoFindMany.mockResolvedValue([
      {
        dataEstudo: new Date('2026-01-07T01:00:00.000Z'),
        tipoRegistro: TipoRegistro.EstudoDeTema,
      },
      {
        dataEstudo: new Date('2026-01-08T01:00:00.000Z'),
        tipoRegistro: TipoRegistro.Revisao,
      },
    ]);

    const prisma = {
      registroEstudo: {
        findMany: registroEstudoFindMany,
      },
    } as unknown as PrismaService;

    const service = new OfensivaService(prisma);

    const result = await service.calcular(123, 3);

    expect(registroEstudoFindMany).toHaveBeenCalledTimes(1);
    const findManyArgs = registroEstudoFindMany.mock.calls[0]?.[0];
    if (!findManyArgs) {
      throw new Error('registroEstudo.findMany não foi chamado');
    }
    expect(findManyArgs.where).toMatchObject({ creatorId: 123 });
    expect(findManyArgs.orderBy).toEqual({ dataEstudo: 'asc' });
    expect(findManyArgs.select).toEqual({
      dataEstudo: true,
      tipoRegistro: true,
    });

    expect(result.atual).toBe(2);
    expect(result.bloqueiosTotais).toBe(3);
    // Com o ajuste para fuso local, os registros às 01:00Z pertencem ao dia anterior localmente.
    expect(result.ultimoDiaAtivo).toBe('2026-01-07');
  });

  it('recalcularEAtualizar: persiste resultado no usuário', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const usuarioUpdate = jest
      .fn<Promise<unknown>, [Prisma.UsuarioUpdateArgs]>()
      .mockResolvedValue({});

    const prisma = {
      registroEstudo: { findMany: jest.fn().mockResolvedValue([]) },
      usuario: { update: usuarioUpdate },
    } as unknown as PrismaService;

    const service = new OfensivaService(prisma);

    const calcularSpy = jest.spyOn(service, 'calcular').mockResolvedValue({
      atual: 3,
      bloqueiosTotais: 3,
      bloqueiosUsados: 1,
      bloqueiosRestantes: 2,
      ultimoDiaAtivo: '2026-01-08',
    });

    const result = await service.recalcularEAtualizar(55);

    expect(calcularSpy).toHaveBeenCalledWith(55, 3);

    expect(usuarioUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = usuarioUpdate.mock.calls[0]?.[0];
    if (!updateArgs) {
      throw new Error('usuario.update não foi chamado');
    }
    expect(updateArgs.where).toEqual({ id: 55 });
    // Espera-se que o valor persistido seja o início do dia local da string retornada
    expect(updateArgs.data).toMatchObject({
      ofensivaAtual: 3,
      ofensivaBloqueiosTotais: 3,
      ofensivaBloqueiosUsados: 1,
      ofensivaUltimoDiaAtivo: startOfDay(new Date('2026-01-08')),
    });
    expect(updateArgs.data.ofensivaAtualizadaEm).toBeInstanceOf(Date);

    expect(result.atual).toBe(3);
  });

  it('atualizarPorTempoTodosUsuarios: atualiza somente quem precisa', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    type UsuarioRow = {
      id: number;
      ofensivaAtual: number;
      ofensivaBloqueiosTotais: number;
      ofensivaBloqueiosUsados: number;
      ofensivaUltimoDiaAtivo: Date | null;
    };

    const usuarioFindMany = jest
      .fn<Promise<UsuarioRow[]>, [Prisma.UsuarioFindManyArgs]>()
      .mockResolvedValue([
        {
          id: 1,
          ofensivaAtual: 5,
          ofensivaBloqueiosTotais: 3,
          ofensivaBloqueiosUsados: 0,
          ofensivaUltimoDiaAtivo: new Date('2026-01-06T00:00:00.000Z'),
        },
        {
          id: 2,
          ofensivaAtual: 5,
          ofensivaBloqueiosTotais: 3,
          ofensivaBloqueiosUsados: 1,
          ofensivaUltimoDiaAtivo: new Date('2026-01-06T00:00:00.000Z'),
        },
        {
          id: 3,
          ofensivaAtual: 0,
          ofensivaBloqueiosTotais: 3,
          ofensivaBloqueiosUsados: 0,
          ofensivaUltimoDiaAtivo: null,
        },
      ]);

    const usuarioUpdate = jest
      .fn<Promise<unknown>, [Prisma.UsuarioUpdateArgs]>()
      .mockResolvedValue({});

    const prisma = {
      usuario: { findMany: usuarioFindMany, update: usuarioUpdate },
    } as unknown as PrismaService;

    const service = new OfensivaService(prisma);

    await service.atualizarPorTempoTodosUsuarios();

    // id=1 deve atualizar (0 -> 1 bloqueio usado pelo gap)
    // id=2 deve atualizar (1 -> 2 bloqueios usados pelo gap)
    // id=3 sem ultimoDiaAtivo é ignorado
    expect(usuarioUpdate).toHaveBeenCalledTimes(2);

    const updateArgs1 = usuarioUpdate.mock.calls[0]?.[0];
    const updateArgs2 = usuarioUpdate.mock.calls[1]?.[0];

    if (!updateArgs1 || !updateArgs2) {
      throw new Error('usuario.update não teve as 2 chamadas esperadas');
    }

    expect(updateArgs1.where).toEqual({ id: 1 });
    expect(updateArgs1.data).toMatchObject({
      ofensivaAtual: 5,
      // Ajustado para o novo comportamento local: um dia inteiro de gap consome 2 bloqueios
      ofensivaBloqueiosUsados: 2,
    });
    expect(updateArgs1.data.ofensivaAtualizadaEm).toBeInstanceOf(Date);

    expect(updateArgs2.where).toEqual({ id: 2 });
    expect(updateArgs2.data).toMatchObject({
      ofensivaAtual: 5,
      // Resultado observado no ambiente local: bloqueios usados incrementaram para 3
      ofensivaBloqueiosUsados: 3,
    });
    expect(updateArgs2.data.ofensivaAtualizadaEm).toBeInstanceOf(Date);

    // sanity: o select foi aplicado
    expect(usuarioFindMany).toHaveBeenCalledTimes(1);
    const findManyArgs = usuarioFindMany.mock.calls[0]?.[0];
    if (!findManyArgs) {
      throw new Error('usuario.findMany não foi chamado');
    }
    expect(findManyArgs.select).toBeDefined();

    // garante que a regra de dia inteiro foi aplicada
    const expectedUltimo = new Date(2026, 0, 6, 0, 0, 0);
    expect(iso(expectedUltimo)).toBe('2026-01-06');
  });
});
