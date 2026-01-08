import { Module } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { MetricsService } from './services/metrics.service';
import { OfensivaModule } from '@/ofensiva/ofensiva.module';
import { PdfIntegrationsModule } from '@/integrations/pdf/pdf.module';

@Module({
  imports: [PrismaModule, OfensivaModule, PdfIntegrationsModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService, MetricsService],
})
export class RelatoriosModule {}
