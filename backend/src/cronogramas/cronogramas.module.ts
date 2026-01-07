import { Module } from '@nestjs/common';
import { CronogramasService } from './cronogramas.service';
import { CronogramasController } from './cronogramas.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CronogramasController],
  providers: [CronogramasService],
  exports: [CronogramasService],
})
export class CronogramasModule {}
