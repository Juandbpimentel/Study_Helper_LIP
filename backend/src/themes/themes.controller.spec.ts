import { ThemesController } from './themes.controller';
import type { ThemesService } from './themes.service';
import type { AuthenticatedRequest } from '@/auth/types';
import type { CreateThemeDto } from './dto/create-theme.dto';
import type { UpdateThemeDto } from './dto/update-theme.dto';
import type { ListThemesQueryDto } from './dto/list-themes.dto';

describe('ThemesController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('create: delega para service com req.user.id', async () => {
    const createMock = jest
      .fn<Promise<unknown>, [number, CreateThemeDto]>()
      .mockResolvedValue({ id: 1 });

    const service: Pick<ThemesService, 'create'> = { create: createMock };
    const controller = new ThemesController(service as ThemesService);

    const req = { user: { id: 7 } } as AuthenticatedRequest;
    const dto = { tema: 'A' } as CreateThemeDto;

    await controller.create(req, dto);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(7, dto);
  });

  it('findAll: delega para service com req.user.id', async () => {
    const findAllMock = jest
      .fn<Promise<unknown>, [number, ListThemesQueryDto]>()
      .mockResolvedValue([]);

    const service: Pick<ThemesService, 'findAll'> = { findAll: findAllMock };
    const controller = new ThemesController(service as ThemesService);

    const req = { user: { id: 9 } } as AuthenticatedRequest;
    const query = { all: true } as ListThemesQueryDto;

    await controller.findAll(req, query);

    expect(findAllMock).toHaveBeenCalledTimes(1);
    expect(findAllMock).toHaveBeenCalledWith(9, query);
  });

  it('findOne: delega para service com req.user.id', async () => {
    const findOneMock = jest
      .fn<Promise<unknown>, [number, number]>()
      .mockResolvedValue({ id: 1 });

    const service: Pick<ThemesService, 'findOne'> = { findOne: findOneMock };
    const controller = new ThemesController(service as ThemesService);

    const req = { user: { id: 3 } } as AuthenticatedRequest;

    await controller.findOne(req, 10);

    expect(findOneMock).toHaveBeenCalledTimes(1);
    expect(findOneMock).toHaveBeenCalledWith(3, 10);
  });

  it('update: delega para service com req.user.id', async () => {
    const updateMock = jest
      .fn<Promise<unknown>, [number, number, UpdateThemeDto]>()
      .mockResolvedValue({ id: 1 });

    const service: Pick<ThemesService, 'update'> = { update: updateMock };
    const controller = new ThemesController(service as ThemesService);

    const req = { user: { id: 4 } } as AuthenticatedRequest;
    const dto = { tema: 'B' } as UpdateThemeDto;

    await controller.update(req, 10, dto);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(4, 10, dto);
  });

  it('remove: delega para service com req.user.id', async () => {
    const removeMock = jest
      .fn<Promise<unknown>, [number, number]>()
      .mockResolvedValue({ id: 1 });

    const service: Pick<ThemesService, 'remove'> = { remove: removeMock };
    const controller = new ThemesController(service as ThemesService);

    const req = { user: { id: 5 } } as AuthenticatedRequest;

    await controller.remove(req, 10);

    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith(5, 10);
  });
});
