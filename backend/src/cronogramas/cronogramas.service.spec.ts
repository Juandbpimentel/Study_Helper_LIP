import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CronogramasService } from './cronogramas.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import type { UpsertCronogramaDto } from './dto/upsert-cronograma.dto';
import type { DiaSemana, Prisma } from '@prisma/client';

describe('CronogramasService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('obterCronogramaComStatus: dataAlvo não pode ser anterior ao createdAt do slot', async () => {
    const cronogramaFindUnique = jest
      .fn<
        Promise<{ id: number; creatorId: number } | null>,
        [Prisma.CronogramaSemanalFindUniqueArgs]
      >()
      .mockResolvedValue({ id: 10, creatorId: 2 });

    const usuarioFindUnique = jest
      .fn<
        Promise<{
          primeiroDiaSemana: DiaSemana;
          slotAtrasoToleranciaDias: number;
          slotAtrasoMaxDias: number;
        } | null>,
        [Prisma.UsuarioFindUniqueArgs]
      >()
      .mockResolvedValue({
        primeiroDiaSemana: 'Dom' as DiaSemana,
        slotAtrasoToleranciaDias: 0,
        slotAtrasoMaxDias: 7,
      });

    const slotFindMany = jest
      .fn<Promise<any[]>, [Prisma.SlotCronogramaFindManyArgs]>()
      .mockResolvedValue([
        {
          id: 1,
          diaSemana: 'Seg' as DiaSemana,
          ordem: 0,
          createdAt: new Date('2026-01-08T14:46:04.101Z'),
          tema: { id: 1, tema: 'IA' },
        },
      ]);

    const registroFindMany = jest
      .fn<Promise<any[]>, [Prisma.RegistroEstudoFindManyArgs]>()
      .mockResolvedValue([]);

    const prisma = {
      usuario: { findUnique: usuarioFindUnique },
      cronogramaSemanal: { findUnique: cronogramaFindUnique },
      slotCronograma: { findMany: slotFindMany },
      registroEstudo: { findMany: registroFindMany },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const service = new CronogramasService(
      prisma,
      googleCalendar as unknown as GoogleCalendarService,
    );

    const result = await service.obterCronogramaComStatus(
      2,
      '2026-01-08T15:43:01.807Z',
    );

    expect(result.cronograma.slots).toHaveLength(1);
    expect(result.cronograma.slots[0].createdAt).toBe(
      '2026-01-08T14:46:04.101Z',
    );
    expect(result.cronograma.slots[0].dataAlvo).toBe(
      '2026-01-12T00:00:00.000Z',
    );
    expect(result.cronograma.slots[0].status).toBe('pendente');
  });

  it('upsert: lança NotFound quando usuário não existe', async () => {
    const cronogramaFindUnique = jest
      .fn<
        Promise<{ id: number; creatorId: number } | null>,
        [Prisma.CronogramaSemanalFindUniqueArgs]
      >()
      .mockResolvedValue({ id: 10, creatorId: 1 });

    const usuarioFindUnique = jest
      .fn<
        Promise<{ maxSlotsPorDia: number | null } | null>,
        [Prisma.UsuarioFindUniqueArgs]
      >()
      .mockResolvedValue(null);

    const prisma = {
      cronogramaSemanal: { findUnique: cronogramaFindUnique },
      usuario: { findUnique: usuarioFindUnique },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const service = new CronogramasService(
      prisma,
      googleCalendar as unknown as GoogleCalendarService,
    );

    const dto: UpsertCronogramaDto = {
      slots: [],
    };

    await expect(service.upsert(1, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('upsert: respeita maxSlotsPorDia e lança BadRequest se exceder', async () => {
    const cronogramaFindUnique = jest
      .fn<
        Promise<{ id: number; creatorId: number } | null>,
        [Prisma.CronogramaSemanalFindUniqueArgs]
      >()
      .mockResolvedValue({ id: 10, creatorId: 1 });

    const usuarioFindUnique = jest
      .fn<
        Promise<{ maxSlotsPorDia: number | null } | null>,
        [Prisma.UsuarioFindUniqueArgs]
      >()
      .mockResolvedValue({ maxSlotsPorDia: 1 });

    const prisma = {
      cronogramaSemanal: { findUnique: cronogramaFindUnique },
      usuario: { findUnique: usuarioFindUnique },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const service = new CronogramasService(
      prisma,
      googleCalendar as unknown as GoogleCalendarService,
    );

    const dto: UpsertCronogramaDto = {
      slots: [
        { diaSemana: 'Seg' as DiaSemana, ordem: 1, temaId: 1 },
        { diaSemana: 'Seg' as DiaSemana, ordem: 2, temaId: 2 },
      ],
    };

    await expect(service.upsert(1, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('upsert: lança BadRequest quando algum tema não pertence ao usuário', async () => {
    const cronogramaFindUnique = jest
      .fn<
        Promise<{ id: number; creatorId: number } | null>,
        [Prisma.CronogramaSemanalFindUniqueArgs]
      >()
      .mockResolvedValue({ id: 10, creatorId: 1 });

    const usuarioFindUnique = jest
      .fn<
        Promise<{ maxSlotsPorDia: number | null } | null>,
        [Prisma.UsuarioFindUniqueArgs]
      >()
      .mockResolvedValue({ maxSlotsPorDia: null });

    const temaFindMany = jest
      .fn<Promise<Array<{ id: number }>>, [Prisma.TemaDeEstudoFindManyArgs]>()
      .mockResolvedValue([{ id: 1 }]);

    const prisma = {
      cronogramaSemanal: { findUnique: cronogramaFindUnique },
      usuario: { findUnique: usuarioFindUnique },
      temaDeEstudo: { findMany: temaFindMany },
    } as unknown as PrismaService;

    const googleCalendar = {} as unknown as GoogleCalendarService;
    const service = new CronogramasService(
      prisma,
      googleCalendar as unknown as GoogleCalendarService,
    );

    const dto: UpsertCronogramaDto = {
      slots: [
        { diaSemana: 'Seg' as DiaSemana, ordem: 1, temaId: 1 },
        { diaSemana: 'Ter' as DiaSemana, ordem: 1, temaId: 2 },
      ],
    };

    await expect(service.upsert(1, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(temaFindMany).toHaveBeenCalledTimes(1);
  });

  it('upsert: remove slots antigos, deleta eventos removidos e faz sync', async () => {
    type TxSlot = { id: number; googleEventId: string | null };

    const cronogramaFindUnique = jest
      .fn<
        Promise<{ id: number; creatorId: number } | null>,
        [Prisma.CronogramaSemanalFindUniqueArgs]
      >()
      .mockResolvedValue({ id: 10, creatorId: 1 });

    const usuarioFindUnique = jest
      .fn<
        Promise<{ maxSlotsPorDia: number | null } | null>,
        [Prisma.UsuarioFindUniqueArgs]
      >()
      .mockResolvedValue({ maxSlotsPorDia: null });

    const temaFindMany = jest
      .fn<Promise<Array<{ id: number }>>, [Prisma.TemaDeEstudoFindManyArgs]>()
      .mockResolvedValue([{ id: 1 }]);

    const txSlotFindMany = jest
      .fn<Promise<TxSlot[]>, [Prisma.SlotCronogramaFindManyArgs]>()
      .mockResolvedValue([
        { id: 11, googleEventId: 'e-keep' },
        { id: 12, googleEventId: 'e-remove' },
      ]);

    const txSlotUpdate = jest
      .fn<Promise<unknown>, [Prisma.SlotCronogramaUpdateArgs]>()
      .mockResolvedValue({});

    const txSlotCreate = jest
      .fn<Promise<{ id: number }>, [Prisma.SlotCronogramaCreateArgs]>()
      .mockResolvedValue({ id: 99 });

    const txSlotDeleteMany = jest
      .fn<Promise<unknown>, [Prisma.SlotCronogramaDeleteManyArgs]>()
      .mockResolvedValue({});

    type TxClient = {
      slotCronograma: {
        findMany: typeof txSlotFindMany;
        update: typeof txSlotUpdate;
        create: typeof txSlotCreate;
        deleteMany: typeof txSlotDeleteMany;
      };
    };

    const tx: TxClient = {
      slotCronograma: {
        findMany: txSlotFindMany,
        update: txSlotUpdate,
        create: txSlotCreate,
        deleteMany: txSlotDeleteMany,
      },
    };

    const transaction = jest.fn<
      Promise<void>,
      [(this: void, tx: TxClient) => Promise<void>]
    >(async (cb) => cb(tx));

    const prisma = {
      cronogramaSemanal: { findUnique: cronogramaFindUnique },
      usuario: { findUnique: usuarioFindUnique },
      temaDeEstudo: { findMany: temaFindMany },
      $transaction: transaction,
    } as unknown as PrismaService;

    const deleteSlotEventsByEventIds = jest
      .fn<Promise<void>, [number, string[]]>()
      .mockResolvedValue(undefined);
    const syncSlotsForUser = jest
      .fn<Promise<void>, [number]>()
      .mockResolvedValue(undefined);

    const googleCalendar: Pick<
      GoogleCalendarService,
      'deleteSlotEventsByEventIds' | 'syncSlotsForUser'
    > = {
      deleteSlotEventsByEventIds,
      syncSlotsForUser,
    };

    const service = new CronogramasService(
      prisma,
      googleCalendar as unknown as GoogleCalendarService,
    );

    type Status = Awaited<
      ReturnType<CronogramasService['obterCronogramaComStatus']>
    >;
    const obterResult: Status = {
      semana: {
        referencia: new Date('2026-01-08T00:00:00.000Z').toISOString(),
        inicio: new Date('2026-01-05T00:00:00.000Z').toISOString(),
        fim: new Date('2026-01-11T00:00:00.000Z').toISOString(),
      },
      cronograma: {
        id: 10,
        slots: [],
      },
    };

    const obterSpy = jest
      .spyOn(service, 'obterCronogramaComStatus')
      .mockResolvedValue(obterResult);

    const dto: UpsertCronogramaDto = {
      slots: [
        // mantém 11 e cria novo
        { id: 11, diaSemana: 'Seg' as DiaSemana, ordem: 1, temaId: 1 },
        { diaSemana: 'Ter' as DiaSemana, ordem: 1, temaId: 1 },
      ],
    };

    const result = await service.upsert(1, dto);

    expect(result).toBe(obterResult);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txSlotFindMany).toHaveBeenCalledTimes(1);
    expect(txSlotUpdate).toHaveBeenCalledTimes(1);
    expect(txSlotCreate).toHaveBeenCalledTimes(1);
    expect(txSlotDeleteMany).toHaveBeenCalledTimes(1);

    expect(deleteSlotEventsByEventIds).toHaveBeenCalledTimes(1);
    expect(deleteSlotEventsByEventIds).toHaveBeenCalledWith(1, ['e-remove']);

    expect(syncSlotsForUser).toHaveBeenCalledTimes(1);
    expect(syncSlotsForUser).toHaveBeenCalledWith(1);

    expect(obterSpy).toHaveBeenCalledTimes(1);
  });
});
