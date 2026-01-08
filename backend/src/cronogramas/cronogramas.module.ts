import { Module } from '@nestjs/common';
import { CronogramasService } from './cronogramas.service';
import { CronogramasController } from './cronogramas.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { GoogleIntegrationsModule } from '@/integrations/google/google.module';

@Module({
  imports: [PrismaModule, GoogleIntegrationsModule],
  controllers: [CronogramasController],
  providers: [CronogramasService],
  exports: [CronogramasService],
})
export class CronogramasModule {}
