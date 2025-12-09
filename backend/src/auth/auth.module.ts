import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnershipGuard } from './guards/ownership.guard';
import { AdminGuard } from './guards/admin.guard';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '30d' },
    }),

    forwardRef(() => UsersModule),
    PrismaModule,
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
  exports: [LocalAuthGuard, JwtAuthGuard, OwnershipGuard, AdminGuard],
})
export class AuthModule {}
