import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import type { OfensivaService } from '@/ofensiva/ofensiva.service';
import type {
  CreateRegistroDto,
  ListRegistrosQueryDto,
} from './dto/create-registro.dto';
import { Prisma, StatusRevisao, TipoRegistro } from '@prisma/client';

describe('RegistrosService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('listar: lança BadRequest quando data é inválida', async () => {
    const findMany = jest.fn<
      Promise<unknown[]>,
      [Prisma.RegistroEstudoFindManyArgs]
    >();

    const prisma = {
      registroEstudo: { findMany },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    const query: ListRegistrosQueryDto = { data: 'not-a-date' };

    await expect(service.listar(1, query)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findMany).toHaveBeenCalledTimes(0);
  });

  it('listar: sem paginação (all=true) chama findMany', async () => {
    const items = [{ id: 1 }, { id: 2 }];

    const findMany = jest
      .fn<Promise<typeof items>, [Prisma.RegistroEstudoFindManyArgs]>()
      .mockResolvedValue(items);

    const prisma = {
      registroEstudo: { findMany },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    const query: ListRegistrosQueryDto = { all: true };

    const result = await service.listar(7, query);

    expect(result).toBe(items);
    expect(findMany).toHaveBeenCalledTimes(1);

    const args = findMany.mock.calls[0]?.[0];
    if (!args) throw new Error('registroEstudo.findMany não foi chamado');
    expect(args.where).toMatchObject({ creatorId: 7 });
    expect(args.orderBy).toEqual({ dataEstudo: 'desc' });
    expect(args.include).toBeDefined();
  });

  it('listar: com paginação retorna items + meta', async () => {
    const items = [{ id: 1 }];

    const transaction = jest
      .fn<Promise<[unknown[], number]>, [Array<unknown>]>()
      .mockResolvedValue([items, 10]);

    const prisma = {
      registroEstudo: {
        findMany: jest.fn<
          Promise<unknown[]>,
          [Prisma.RegistroEstudoFindManyArgs]
        >(),
        count: jest.fn<Promise<number>, [Prisma.RegistroEstudoCountArgs]>(),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    const query: ListRegistrosQueryDto = { page: 2, pageSize: 5 };

    const result = await service.listar(9, query);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      items,
      meta: {
        total: 10,
        page: 2,
        pageSize: 5,
        totalPages: 2,
      },
    });
  });

  it('criar: após tx sincroniza revisões criadas e atualiza ofensiva', async () => {
    const registro = { id: 123 };

    const transaction = jest
      .fn<
        Promise<{ registro: typeof registro; revisoesCriadasIds: number[] }>,
        [
          (
            this: void,
            tx: Prisma.TransactionClient,
          ) => Promise<{
            registro: typeof registro;
            revisoesCriadasIds: number[];
          }>,
        ]
      >()
      .mockResolvedValue({ registro, revisoesCriadasIds: [1, 2] });

    const prisma = {
      $transaction: transaction,
    } as unknown as PrismaService;

    const syncRevisionById = jest
      .fn<Promise<void>, [number, number]>()
      .mockResolvedValue(undefined);

    const googleCalendar: Pick<GoogleCalendarService, 'syncRevisionById'> = {
      syncRevisionById,
    };

    const recalcularEAtualizar = jest
      .fn<ReturnType<OfensivaService['recalcularEAtualizar']>, [number]>()
      .mockResolvedValue(
        {} as Awaited<ReturnType<OfensivaService['recalcularEAtualizar']>>,
      );

    const ofensiva: Pick<OfensivaService, 'recalcularEAtualizar'> = {
      recalcularEAtualizar,
    };

    const service = new RegistrosService(
      prisma,
      googleCalendar as GoogleCalendarService,
      ofensiva as OfensivaService,
    );

    const dto = {
      tipoRegistro: TipoRegistro.EstudoAberto,
      tempoDedicado: 10,
    } as CreateRegistroDto;

    const result = await service.criar(5, dto);

    expect(result).toBe(registro);
    expect(syncRevisionById).toHaveBeenCalledTimes(2);
    expect(syncRevisionById).toHaveBeenNthCalledWith(1, 5, 1);
    expect(syncRevisionById).toHaveBeenNthCalledWith(2, 5, 2);
    expect(recalcularEAtualizar).toHaveBeenCalledTimes(1);
    expect(recalcularEAtualizar).toHaveBeenCalledWith(5);
  });

  it('criarComTx: EstudoDeTema cria registro e revisões', async () => {
    const registroCreate = jest
      .fn<
        Promise<{ id: number; slotId: number | null }>,
        [Prisma.RegistroEstudoCreateArgs]
      >()
      .mockResolvedValue({ id: 55, slotId: 10 });

    const tx = {
      temaDeEstudo: {
        findFirst: jest
          .fn<
            Promise<{ id: number } | null>,
            [Prisma.TemaDeEstudoFindFirstArgs]
          >()
          .mockResolvedValue({ id: 1 }),
      },
      slotCronograma: {
        findFirst: jest
          .fn<
            Promise<{ id: number; temaId: number } | null>,
            [Prisma.SlotCronogramaFindFirstArgs]
          >()
          .mockResolvedValue({ id: 10, temaId: 1 }),
      },
      revisaoProgramada: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.RevisaoProgramadaFindFirstArgs]>()
          .mockResolvedValue(null),
        create: jest
          .fn<Promise<{ id: number }>, [Prisma.RevisaoProgramadaCreateArgs]>()
          .mockResolvedValueOnce({ id: 100 })
          .mockResolvedValueOnce({ id: 101 }),
      },
      usuario: {
        findUnique: jest
          .fn<
            Promise<{ planejamentoRevisoes: number[] } | null>,
            [Prisma.UsuarioFindUniqueArgs]
          >()
          .mockResolvedValue({ planejamentoRevisoes: [1, 7] }),
      },
      registroEstudo: {
        create: registroCreate,
      },
    } as unknown as Prisma.TransactionClient;

    const prisma = {} as unknown as PrismaService;
    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    const dto: CreateRegistroDto = {
      tipoRegistro: TipoRegistro.EstudoDeTema,
      tempoDedicado: 30,
      temaId: 1,
      slotId: 10,
      dataEstudo: '2026-01-08T12:00:00.000Z',
    };

    const result = await service.criarComTx(tx, 9, dto);

    expect(result.registro.id).toBe(55);
    expect(result.revisoesCriadasIds).toEqual([100, 101]);

    const createArgs = registroCreate.mock.calls[0]?.[0];
    if (!createArgs) throw new Error('registroEstudo.create não foi chamado');
    expect(createArgs.data).toMatchObject({
      creatorId: 9,
      tipoRegistro: TipoRegistro.EstudoDeTema,
      temaId: 1,
      slotId: 10,
    });
  });

  it('criarComTx: Revisao conclui revisaoProgramada e usa tema do registroOrigem', async () => {
    const revisao = {
      id: 77,
      statusRevisao: StatusRevisao.Pendente,
      registroOrigem: { temaId: 42 },
    };

    const txRevisaoUpdate = jest
      .fn<Promise<unknown>, [Prisma.RevisaoProgramadaUpdateArgs]>()
      .mockResolvedValue({});

    const tx = {
      temaDeEstudo: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
          .mockResolvedValue(null),
      },
      slotCronograma: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.SlotCronogramaFindFirstArgs]>()
          .mockResolvedValue(null),
      },
      revisaoProgramada: {
        findFirst: jest
          .fn<
            Promise<typeof revisao | null>,
            [Prisma.RevisaoProgramadaFindFirstArgs]
          >()
          .mockResolvedValue(revisao),
        update: txRevisaoUpdate,
      },
      registroEstudo: {
        create: jest
          .fn<
            Promise<{ id: number; slotId: number | null }>,
            [Prisma.RegistroEstudoCreateArgs]
          >()
          .mockResolvedValue({ id: 88, slotId: null }),
      },
    } as unknown as Prisma.TransactionClient;

    const prisma = {} as unknown as PrismaService;
    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    const dto: CreateRegistroDto = {
      tipoRegistro: TipoRegistro.Revisao,
      tempoDedicado: 15,
      revisaoProgramadaId: 77,
      dataEstudo: '2026-01-08T12:00:00.000Z',
    };

    const result = await service.criarComTx(tx, 1, dto);

    expect(result.registro.id).toBe(88);
    expect(result.revisoesCriadasIds).toEqual([]);

    expect(txRevisaoUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = txRevisaoUpdate.mock.calls[0]?.[0];
    if (!updateArgs)
      throw new Error('revisaoProgramada.update não foi chamado');
    expect(updateArgs.where).toEqual({ id: 77 });
    expect(updateArgs.data).toMatchObject({
      statusRevisao: StatusRevisao.Concluida,
      registroConclusaoId: 88,
    });
  });

  it('criarComTx: se update de revisão falhar por P2002 deve lançar BadRequest', async () => {
    const revisao = {
      id: 123,
      statusRevisao: StatusRevisao.Pendente,
      registroOrigem: { temaId: 42 },
    };

    const tx = {
      temaDeEstudo: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
          .mockResolvedValue(null),
      },
      slotCronograma: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.SlotCronogramaFindFirstArgs]>()
          .mockResolvedValue(null),
      },
      revisaoProgramada: {
        findFirst: jest
          .fn<
            Promise<typeof revisao | null>,
            [Prisma.RevisaoProgramadaFindFirstArgs]
          >()
          .mockResolvedValue(revisao),
        update: jest
          .fn<Promise<unknown>, [Prisma.RevisaoProgramadaUpdateArgs]>()
          .mockRejectedValue({
            code: 'P2002',
            meta: { constraint: { fields: ['registro_conclusao_id'] } },
          }),
      },
      registroEstudo: {
        create: jest
          .fn<
            Promise<{ id: number; slotId: number | null }>,
            [Prisma.RegistroEstudoCreateArgs]
          >()
          .mockResolvedValue({ id: 200, slotId: null }),
      },
    } as unknown as Prisma.TransactionClient;

    const service = new RegistrosService(
      {} as unknown as PrismaService,
      {} as unknown as GoogleCalendarService,
      {} as unknown as OfensivaService,
    );

    const dto: CreateRegistroDto = {
      tipoRegistro: TipoRegistro.Revisao,
      tempoDedicado: 10,
      revisaoProgramadaId: 123,
    };

    await expect(service.criarComTx(tx, 1, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('criarComTx: Revisao já concluída lança BadRequest', async () => {
    const revisao = {
      id: 77,
      statusRevisao: StatusRevisao.Concluida,
      registroOrigem: { temaId: 42 },
    };

    const tx = {
      temaDeEstudo: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
          .mockResolvedValue(null),
      },
      slotCronograma: {
        findFirst: jest
          .fn<Promise<null>, [Prisma.SlotCronogramaFindFirstArgs]>()
          .mockResolvedValue(null),
      },
      revisaoProgramada: {
        findFirst: jest
          .fn<
            Promise<typeof revisao | null>,
            [Prisma.RevisaoProgramadaFindFirstArgs]
          >()
          .mockResolvedValue(revisao),
      },
      registroEstudo: {
        create: jest
          .fn<
            Promise<{ id: number; slotId: number | null }>,
            [Prisma.RegistroEstudoCreateArgs]
          >()
          .mockResolvedValue({ id: 88, slotId: null }),
      },
    } as unknown as Prisma.TransactionClient;

    const prisma = {} as unknown as PrismaService;
    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    const dto: CreateRegistroDto = {
      tipoRegistro: TipoRegistro.Revisao,
      tempoDedicado: 15,
      revisaoProgramadaId: 77,
    };

    await expect(service.criarComTx(tx, 1, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('remover: lança NotFound quando registro não pertence ao usuário', async () => {
    const findFirst = jest
      .fn<Promise<null>, [Prisma.RegistroEstudoFindFirstArgs]>()
      .mockResolvedValue(null);

    const prisma = {
      registroEstudo: { findFirst },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const ofensiva = {} as unknown as OfensivaService;

    const service = new RegistrosService(prisma, googleCalendar, ofensiva);

    await expect(service.remover(1, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remover: remove registro, limpa eventos e recalcula ofensiva', async () => {
    const preRegistro = {
      id: 10,
      revisoesGeradas: [{ googleEventId: 'ev-1' }, { googleEventId: null }],
      revisaoConcluida: { id: 999 },
    };

    const findFirst = jest
      .fn<
        Promise<typeof preRegistro | null>,
        [Prisma.RegistroEstudoFindFirstArgs]
      >()
      .mockResolvedValue(preRegistro);

    const txFindMany = jest
      .fn<
        Promise<Array<{ id: number }>>,
        [Prisma.RevisaoProgramadaFindManyArgs]
      >()
      .mockResolvedValue([{ id: 201 }, { id: 202 }]);

    const txUpdateMany = jest
      .fn<Promise<unknown>, [Prisma.RevisaoProgramadaUpdateManyArgs]>()
      .mockResolvedValue({});

    const txDelete = jest
      .fn<Promise<{ id: number }>, [Prisma.RegistroEstudoDeleteArgs]>()
      .mockResolvedValue({ id: 10 });

    type TxClient = {
      revisaoProgramada: {
        findMany: typeof txFindMany;
        updateMany: typeof txUpdateMany;
      };
      registroEstudo: {
        delete: typeof txDelete;
      };
    };

    const tx: TxClient = {
      revisaoProgramada: {
        findMany: txFindMany,
        updateMany: txUpdateMany,
      },
      registroEstudo: {
        delete: txDelete,
      },
    };

    const transaction = jest.fn<
      Promise<{ id: number }>,
      [(this: void, tx: TxClient) => Promise<{ id: number }>]
    >(async (cb) => cb(tx));

    const prisma = {
      registroEstudo: { findFirst },
      $transaction: transaction,
    } as unknown as PrismaService;

    const deleteRevisionEventsByEventIds = jest
      .fn<Promise<void>, [number, string[]]>()
      .mockResolvedValue(undefined);

    const syncRevisionById = jest
      .fn<Promise<void>, [number, number]>()
      .mockResolvedValue(undefined);

    const googleCalendar: Pick<
      GoogleCalendarService,
      'deleteRevisionEventsByEventIds' | 'syncRevisionById'
    > = {
      deleteRevisionEventsByEventIds,
      syncRevisionById,
    };

    const recalcularEAtualizar = jest
      .fn<Promise<unknown>, [number]>()
      .mockResolvedValue({});

    const ofensiva: Pick<OfensivaService, 'recalcularEAtualizar'> = {
      recalcularEAtualizar,
    };

    const service = new RegistrosService(
      prisma,
      googleCalendar as GoogleCalendarService,
      ofensiva as OfensivaService,
    );

    const result = await service.remover(5, 10);

    expect(result).toEqual({ id: 10 });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txFindMany).toHaveBeenCalledTimes(1);
    expect(txUpdateMany).toHaveBeenCalledTimes(1);
    expect(txDelete).toHaveBeenCalledTimes(1);

    expect(deleteRevisionEventsByEventIds).toHaveBeenCalledTimes(1);
    expect(deleteRevisionEventsByEventIds).toHaveBeenCalledWith(5, ['ev-1']);

    expect(syncRevisionById).toHaveBeenCalledTimes(2);
    expect(syncRevisionById).toHaveBeenNthCalledWith(1, 5, 201);
    expect(syncRevisionById).toHaveBeenNthCalledWith(2, 5, 202);

    expect(recalcularEAtualizar).toHaveBeenCalledTimes(1);
    expect(recalcularEAtualizar).toHaveBeenCalledWith(5);
  });
});
