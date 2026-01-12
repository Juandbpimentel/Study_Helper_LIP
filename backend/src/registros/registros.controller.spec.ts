import { RegistrosController } from './registros.controller';
import type { RegistrosService } from './registros.service';
import type { AuthenticatedRequest } from '@/auth/types';
import type {
  CreateRegistroDto,
  ListRegistrosQueryDto,
} from './dto/create-registro.dto';

describe('RegistrosController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('listar: delega para service com req.user.id', async () => {
    const listarMock = jest
      .fn<
        ReturnType<RegistrosService['listar']>,
        [number, ListRegistrosQueryDto]
      >()
      .mockResolvedValue([] as Awaited<ReturnType<RegistrosService['listar']>>);

    const service: Pick<RegistrosService, 'listar'> = {
      listar: listarMock,
    };

    const controller = new RegistrosController(service as RegistrosService);

    const req = { user: { id: 7 } } as AuthenticatedRequest;
    const query = { all: true } as ListRegistrosQueryDto;

    await controller.listar(req, query);

    expect(listarMock).toHaveBeenCalledTimes(1);
    expect(listarMock).toHaveBeenCalledWith(7, query);
  });

  it('criar: delega para service com req.user.id', async () => {
    const criarMock = jest
      .fn<ReturnType<RegistrosService['criar']>, [number, CreateRegistroDto]>()
      .mockResolvedValue({ id: 1 } as Awaited<
        ReturnType<RegistrosService['criar']>
      >);

    const service: Pick<RegistrosService, 'criar'> = {
      criar: criarMock,
    };

    const controller = new RegistrosController(service as RegistrosService);

    const req = { user: { id: 9 } } as AuthenticatedRequest;
    const dto = { tempoDedicado: 10 } as CreateRegistroDto;

    await controller.criar(req, dto);

    expect(criarMock).toHaveBeenCalledTimes(1);
    expect(criarMock).toHaveBeenCalledWith(9, dto);
  });

  it('remover: delega para service com req.user.id', async () => {
    const removerMock = jest
      .fn<ReturnType<RegistrosService['remover']>, [number, number]>()
      .mockResolvedValue({ id: 10 } as Awaited<
        ReturnType<RegistrosService['remover']>
      >);

    const service: Pick<RegistrosService, 'remover'> = {
      remover: removerMock,
    };

    const controller = new RegistrosController(service as RegistrosService);

    const req = { user: { id: 3 } } as AuthenticatedRequest;

    await controller.remover(req, 10);

    expect(removerMock).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledWith(3, 10);
  });

  it('buscarPorId: delega para service com req.user.id', async () => {
    const buscarMock = jest
      .fn<Promise<unknown>, [number, number]>()
      .mockResolvedValue({ id: 55 });

    const service: Pick<RegistrosService, 'buscarPorId'> = {
      buscarPorId: buscarMock,
    } as unknown as Pick<RegistrosService, 'buscarPorId'>;

    const controller = new RegistrosController(service as RegistrosService);

    const req = { user: { id: 12 } } as AuthenticatedRequest;

    const result = await controller.buscarPorId(req, 55);

    expect(buscarMock).toHaveBeenCalledTimes(1);
    expect(buscarMock).toHaveBeenCalledWith(12, 55);
    expect(result).toEqual({ id: 55 });
  });

  it('buscarPorId: propaga NotFoundException quando serviço lança', async () => {
    const buscarMock = jest
      .fn<Promise<unknown>, [number, number]>()
      .mockRejectedValue(new Error('not found'));

    const service: Pick<RegistrosService, 'buscarPorId'> = {
      buscarPorId: buscarMock,
    } as unknown as Pick<RegistrosService, 'buscarPorId'>;

    const controller = new RegistrosController(service as RegistrosService);

    const req = { user: { id: 8 } } as AuthenticatedRequest;

    await expect(controller.buscarPorId(req, 999)).rejects.toBeInstanceOf(
      Error,
    );

    expect(buscarMock).toHaveBeenCalledTimes(1);
    expect(buscarMock).toHaveBeenCalledWith(8, 999);
  });
});
