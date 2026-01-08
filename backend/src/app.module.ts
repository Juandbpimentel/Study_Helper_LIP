import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThemesModule } from '@/themes/themes.module';
import { CronogramasModule } from '@/cronogramas/cronogramas.module';
import { RegistrosModule } from '@/registros/registros.module';
import { RevisoesModule } from '@/revisoes/revisoes.module';
import { RelatoriosModule } from '@/relatorios/relatorios.module';
import { GoogleIntegrationsModule } from '@/integrations/google/google.module';
import { PublicController } from './public/public.controller';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ThemesModule,
    CronogramasModule,
    RegistrosModule,
    RevisoesModule,
    RelatoriosModule,
    GoogleIntegrationsModule,
  ],
  controllers: [AppController, PublicController],
  providers: [AppService],
})
export class AppModule {}
