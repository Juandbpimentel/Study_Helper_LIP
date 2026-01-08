import { forwardRef, Module } from '@nestjs/common';
import { RevisoesService } from './revisoes.service';
import { RevisoesController } from './revisoes.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { RegistrosModule } from '@/registros/registros.module';
import { GoogleIntegrationsModule } from '@/integrations/google/google.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => RegistrosModule),
    GoogleIntegrationsModule,
  ],
  controllers: [RevisoesController],
  providers: [RevisoesService],
  exports: [RevisoesService],
})
export class RevisoesModule {}
