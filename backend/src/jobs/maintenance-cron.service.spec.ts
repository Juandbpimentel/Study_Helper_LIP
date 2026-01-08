import { Logger } from '@nestjs/common';
import { MaintenanceCronService } from './maintenance-cron.service';
import type { OfensivaService } from '@/ofensiva/ofensiva.service';
import type { RevisoesService } from '@/revisoes/revisoes.service';

describe('MaintenanceCronService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('executa as duas rotinas no sucesso', async () => {
    const ofensivaService: Pick<
      OfensivaService,
      'atualizarPorTempoTodosUsuarios'
    > = {
      atualizarPorTempoTodosUsuarios: jest.fn().mockResolvedValue(undefined),
    };
    const revisoesService: Pick<
      RevisoesService,
      'atualizarStatusAutomaticoTodosUsuarios'
    > = {
      atualizarStatusAutomaticoTodosUsuarios: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const service = new MaintenanceCronService(
      ofensivaService,
      revisoesService,
    );

    await service.dailyMaintenance();

    expect(
      ofensivaService.atualizarPorTempoTodosUsuarios,
    ).toHaveBeenCalledTimes(1);
    expect(
      revisoesService.atualizarStatusAutomaticoTodosUsuarios,
    ).toHaveBeenCalledTimes(1);
  });

  it('se ofensiva falhar, ainda atualiza revisões (best-effort)', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const ofensivaService: Pick<
      OfensivaService,
      'atualizarPorTempoTodosUsuarios'
    > = {
      atualizarPorTempoTodosUsuarios: jest
        .fn()
        .mockRejectedValue(new Error('boom-ofensiva')),
    };
    const revisoesService: Pick<
      RevisoesService,
      'atualizarStatusAutomaticoTodosUsuarios'
    > = {
      atualizarStatusAutomaticoTodosUsuarios: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    const service = new MaintenanceCronService(
      ofensivaService,
      revisoesService,
    );

    await service.dailyMaintenance();

    expect(
      ofensivaService.atualizarPorTempoTodosUsuarios,
    ).toHaveBeenCalledTimes(1);
    expect(
      revisoesService.atualizarStatusAutomaticoTodosUsuarios,
    ).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('se revisões falhar, não quebra execução', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const ofensivaService: Pick<
      OfensivaService,
      'atualizarPorTempoTodosUsuarios'
    > = {
      atualizarPorTempoTodosUsuarios: jest.fn().mockResolvedValue(undefined),
    };
    const revisoesService: Pick<
      RevisoesService,
      'atualizarStatusAutomaticoTodosUsuarios'
    > = {
      atualizarStatusAutomaticoTodosUsuarios: jest
        .fn()
        .mockRejectedValue(new Error('boom-revisoes')),
    };

    const service = new MaintenanceCronService(
      ofensivaService,
      revisoesService,
    );

    await service.dailyMaintenance();

    expect(
      ofensivaService.atualizarPorTempoTodosUsuarios,
    ).toHaveBeenCalledTimes(1);
    expect(
      revisoesService.atualizarStatusAutomaticoTodosUsuarios,
    ).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});
