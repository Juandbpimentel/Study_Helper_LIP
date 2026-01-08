import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/prisma/prisma.module';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleCalendarService } from './google-calendar.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
    }),
  ],
  controllers: [GoogleOAuthController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleIntegrationsModule {}
