import { forwardRef, Module } from '@nestjs/common';
import { RevisoesService } from './revisoes.service';
import { RevisoesController } from './revisoes.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { RegistrosModule } from '@/registros/registros.module';

@Module({
  imports: [PrismaModule, forwardRef(() => RegistrosModule)],
  controllers: [RevisoesController],
  providers: [RevisoesService],
  exports: [RevisoesService],
})
export class RevisoesModule {}
