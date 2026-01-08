import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@/prisma/prisma.module';
import { UsersModule } from '@/users/users.module';
import { GoogleIntegrationsModule } from '@/integrations/google/google.module';
import { OfensivaModule } from '@/common/ofensiva/ofensiva.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { OwnershipGuard } from './guards/ownership.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '30d' },
    }),
    forwardRef(() => UsersModule),
    PrismaModule,
    GoogleIntegrationsModule,
    OfensivaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    OwnershipGuard,
    AdminGuard,
  ],
  exports: [
    LocalAuthGuard,
    JwtAuthGuard,
    OwnershipGuard,
    AdminGuard,
    AuthService,
  ],
})
export class AuthModule {}
