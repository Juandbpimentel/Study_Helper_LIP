import { RelatoriosController } from './relatorios.controller';
import type { RelatoriosService } from './relatorios.service';
import type { AuthenticatedRequest } from '@/auth/types';
import type { ResumoRelatorioQueryDto } from './dto/resumo-query.dto';

describe('RelatoriosController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resumo: delega para service com req.user.id', async () => {
    const resumoMock = jest
      .fn<Promise<unknown>, [number, ResumoRelatorioQueryDto]>()
      .mockResolvedValue({});

    const service: Pick<RelatoriosService, 'resumo'> = {
      resumo: resumoMock,
    };

    const controller = new RelatoriosController(service as RelatoriosService);

    const req = { user: { id: 7 } } as AuthenticatedRequest;
    const query = { temaId: 1 } as ResumoRelatorioQueryDto;

    await controller.resumo(req, query);

    expect(resumoMock).toHaveBeenCalledTimes(1);
    expect(resumoMock).toHaveBeenCalledWith(7, query);
  });
});
