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
      .fn<Promise<unknown>, [number, ListRegistrosQueryDto]>()
      .mockResolvedValue([]);

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
      .fn<Promise<unknown>, [number, CreateRegistroDto]>()
      .mockResolvedValue({ id: 1 });

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
      .fn<Promise<unknown>, [number, number]>()
      .mockResolvedValue({ id: 10 });

    const service: Pick<RegistrosService, 'remover'> = {
      remover: removerMock,
    };

    const controller = new RegistrosController(service as RegistrosService);

    const req = { user: { id: 3 } } as AuthenticatedRequest;

    await controller.remover(req, 10);

    expect(removerMock).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledWith(3, 10);
  });
});
