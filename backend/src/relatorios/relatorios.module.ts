import { Module } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { MetricsService } from '@/common/services/metrics.service';
import { OfensivaModule } from '@/common/ofensiva/ofensiva.module';

@Module({
  imports: [PrismaModule, OfensivaModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService, MetricsService],
})
export class RelatoriosModule {}
