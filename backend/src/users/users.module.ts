import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { GoogleIntegrationsModule } from '@/integrations/google/google.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    GoogleIntegrationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
