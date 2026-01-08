import { NotFoundException } from '@nestjs/common';
import { ThemesService } from './themes.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { CreateThemeDto } from './dto/create-theme.dto';
import type { UpdateThemeDto } from './dto/update-theme.dto';
import type { ListThemesQueryDto } from './dto/list-themes.dto';
import type { Prisma } from '@prisma/client';

describe('ThemesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('create: normaliza campos (trim + uppercase + #) e persiste', async () => {
    const create = jest
      .fn<Promise<{ id: number }>, [Prisma.TemaDeEstudoCreateArgs]>()
      .mockResolvedValue({ id: 1 });

    const prisma = {
      temaDeEstudo: { create },
    } as unknown as PrismaService;

    const service = new ThemesService(prisma);

    const dto: CreateThemeDto = {
      tema: '  Matemática  ',
      descricao: '  trigonometria  ',
      cor: '3366ff',
    };

    const result = await service.create(7, dto);

    expect(result).toEqual({ id: 1 });
    expect(create).toHaveBeenCalledTimes(1);

    const args = create.mock.calls[0]?.[0];
    if (!args) throw new Error('temaDeEstudo.create não foi chamado');

    expect(args.data).toEqual({
      tema: 'Matemática',
      descricao: 'trigonometria',
      cor: '#3366FF',
      creatorId: 7,
    });
  });

  it('findAll: sem paginação retorna array', async () => {
    const findMany = jest
      .fn<Promise<unknown[]>, [Prisma.TemaDeEstudoFindManyArgs]>()
      .mockResolvedValue([{ id: 1 }]);

    const prisma = {
      temaDeEstudo: { findMany },
    } as unknown as PrismaService;

    const service = new ThemesService(prisma);

    const result = await service.findAll(3, {
      all: true,
    } as ListThemesQueryDto);

    expect(Array.isArray(result)).toBe(true);
    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0]?.[0];
    if (!args) throw new Error('temaDeEstudo.findMany não foi chamado');
    expect(args.where).toEqual({ creatorId: 3 });
    expect(args.orderBy).toEqual({ tema: 'asc' });
    expect(args.include?._count?.select).toEqual({
      slots: true,
      registros: true,
    });
  });

  it('findAll: com paginação retorna items + meta', async () => {
    const transaction = jest
      .fn<Promise<[unknown[], number]>, [Array<unknown>]>()
      .mockResolvedValue([[{ id: 1 }], 12]);

    const prisma = {
      temaDeEstudo: {
        findMany: jest.fn<
          Promise<unknown[]>,
          [Prisma.TemaDeEstudoFindManyArgs]
        >(),
        count: jest.fn<Promise<number>, [Prisma.TemaDeEstudoCountArgs]>(),
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const service = new ThemesService(prisma);

    const result = await service.findAll(3, {
      page: 2,
      pageSize: 5,
    } as ListThemesQueryDto);

    expect(result).toEqual({
      items: [{ id: 1 }],
      meta: {
        total: 12,
        page: 2,
        pageSize: 5,
        totalPages: 3,
      },
    });
  });

  it('findOne: quando tema não pertence lança NotFound', async () => {
    const findFirst = jest
      .fn<Promise<null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
      .mockResolvedValue(null);

    const prisma = {
      temaDeEstudo: { findFirst },
    } as unknown as PrismaService;

    const service = new ThemesService(prisma);

    await expect(service.findOne(1, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update: valida ownership e atualiza com normalização de cor', async () => {
    const findFirst = jest
      .fn<Promise<{ id: number } | null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
      .mockResolvedValue({ id: 10 });

    const update = jest
      .fn<Promise<{ id: number }>, [Prisma.TemaDeEstudoUpdateArgs]>()
      .mockResolvedValue({ id: 10 });

    const prisma = {
      temaDeEstudo: { findFirst, update },
    } as unknown as PrismaService;

    const service = new ThemesService(prisma);

    const dto: UpdateThemeDto = { cor: '#3366ff', tema: '  Novo  ' };

    const result = await service.update(7, 10, dto);

    expect(result).toEqual({ id: 10 });
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);

    const args = update.mock.calls[0]?.[0];
    if (!args) throw new Error('temaDeEstudo.update não foi chamado');
    expect(args.where).toEqual({ id: 10 });
    expect(args.data).toEqual({
      tema: 'Novo',
      descricao: undefined,
      cor: '#3366FF',
    });
  });

  it('remove: quando não pertence lança NotFound', async () => {
    const findFirst = jest
      .fn<Promise<null>, [Prisma.TemaDeEstudoFindFirstArgs]>()
      .mockResolvedValue(null);

    const prisma = {
      temaDeEstudo: {
        findFirst,
        delete: jest.fn(),
      },
    } as unknown as PrismaService;

    const service = new ThemesService(prisma);

    await expect(service.remove(1, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
