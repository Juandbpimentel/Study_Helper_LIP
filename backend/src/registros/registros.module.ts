import { Module } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { RegistrosController } from './registros.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { GoogleIntegrationsModule } from '@/integrations/google/google.module';
import { OfensivaModule } from '@/ofensiva/ofensiva.module';

@Module({
  imports: [PrismaModule, GoogleIntegrationsModule, OfensivaModule],
  controllers: [RegistrosController],
  providers: [RegistrosService],
  exports: [RegistrosService],
})
export class RegistrosModule {}
