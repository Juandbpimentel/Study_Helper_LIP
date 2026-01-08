import { Module } from '@nestjs/common';
import { MaintenanceCronService } from './maintenance-cron.service';
import { OfensivaModule } from '@/ofensiva/ofensiva.module';
import { RevisoesModule } from '@/revisoes/revisoes.module';

@Module({
  imports: [OfensivaModule, RevisoesModule],
  providers: [MaintenanceCronService],
})
export class JobsModule {}
