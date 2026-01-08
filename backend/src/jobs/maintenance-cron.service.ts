import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OfensivaService } from '@/ofensiva/ofensiva.service';
import { RevisoesService } from '@/revisoes/revisoes.service';

@Injectable()
export class MaintenanceCronService {
  private readonly logger = new Logger(MaintenanceCronService.name);

  constructor(
    private readonly ofensivaService: OfensivaService,
    private readonly revisoesService: RevisoesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async dailyMaintenance(): Promise<void> {
    try {
      await this.ofensivaService.atualizarPorTempoTodosUsuarios();
    } catch (err) {
      this.logger.warn('Falha ao atualizar ofensivas por tempo', err);
    }

    try {
      await this.revisoesService.atualizarStatusAutomaticoTodosUsuarios();
    } catch (err) {
      this.logger.warn('Falha ao atualizar status de revisões', err);
    }
  }
}
