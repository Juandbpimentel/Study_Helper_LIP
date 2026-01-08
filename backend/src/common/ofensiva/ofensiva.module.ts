import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { OfensivaService } from '@/common/services/ofensiva.service';

@Module({
  imports: [PrismaModule],
  providers: [OfensivaService],
  exports: [OfensivaService],
})
export class OfensivaModule {}
