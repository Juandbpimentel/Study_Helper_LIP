import { RevisoesService } from './revisoes.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import type { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import type { RegistrosService } from '@/registros/registros.service';

describe('RevisoesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('atualizarStatusAutomaticoTodosUsuarios: chama atualizarStatusAutomatico para cada usuário', async () => {
    const usuarioFindMany = jest
      .fn<Promise<Array<{ id: number }>>, [Prisma.UsuarioFindManyArgs]>()
      .mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const prisma = {
      usuario: {
        findMany: usuarioFindMany,
      },
    } as unknown as PrismaService;

    const service = new RevisoesService(
      prisma,
      {} as unknown as GoogleCalendarService,
      {} as unknown as RegistrosService,
    );

    const atualizarSpy = jest
      .spyOn(service, 'atualizarStatusAutomatico')
      .mockResolvedValue(undefined);

    await service.atualizarStatusAutomaticoTodosUsuarios();

    expect(usuarioFindMany).toHaveBeenCalledTimes(1);
    const findManyArgs = usuarioFindMany.mock.calls[0]?.[0];
    if (!findManyArgs) {
      throw new Error('usuario.findMany não foi chamado');
    }
    expect(findManyArgs.select).toEqual({ id: true });
    expect(atualizarSpy).toHaveBeenCalledTimes(2);
    expect(atualizarSpy).toHaveBeenNthCalledWith(1, 1);
    expect(atualizarSpy).toHaveBeenNthCalledWith(2, 2);
  });
});
