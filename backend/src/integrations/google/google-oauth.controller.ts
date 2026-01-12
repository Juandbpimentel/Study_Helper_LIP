import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import { GoogleCalendarService } from './google-calendar.service';

@ApiTags('Integrações - Google Calendar')
@Controller('integrations/google')
export class GoogleOAuthController {
  constructor(private readonly google: GoogleCalendarService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Iniciar OAuth do Google Calendar',
    description:
      'Gera a URL de consentimento do Google Calendar para o usuário autenticado. Por padrão retorna JSON (compatível com Swagger). Use ?redirect=1 para redirecionar no navegador.',
  })
  @ApiQuery({
    name: 'redirect',
    required: false,
    description: 'Quando 1/true, responde com 302 redirect para a authUrl.',
  })
  @Get('oauth/start')
  start(
    @Req() req: AuthenticatedRequest,
    @Query('redirect') redirect?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const url = this.google.buildAuthUrl(req.user.id);

    const shouldRedirect =
      typeof redirect === 'string' &&
      ['1', 'true', 'yes'].includes(redirect.toLowerCase());

    if (shouldRedirect && res) {
      return res.redirect(url);
    }

    return { ok: true, authUrl: url, redirect: shouldRedirect };
  }

  @ApiOperation({
    summary: 'Callback OAuth do Google Calendar',
    description:
      'Endpoint de callback configurado no Google Cloud. Troca o code por tokens, persiste a integração e executa sync backend→Google.',
  })
  @Get('oauth/callback')
  async callback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ) {
    if (!code) throw new BadRequestException('Parâmetro "code" ausente');
    if (!state) throw new BadRequestException('Parâmetro "state" ausente');

    const { redirectUrl } = await this.google.handleOAuthCallback(code, state);
    if (res) {
      return res.redirect(redirectUrl);
    }
    return { ok: true, redirectUrl };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Status da integração Google Calendar do usuário autenticado',
  })
  @ApiOkResponse({
    schema: { example: { connected: false, calendarId: null } },
  })
  @Get('status')
  async status(@Req() req: AuthenticatedRequest) {
    return this.google.getUserIntegrationStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Desconectar Google Calendar',
    description:
      'Remove tokens/IDs persistidos da integração. Não remove eventos já criados no Google (a menos que você apague o calendário manualmente).',
  })
  @Delete('disconnect')
  async disconnect(@Req() req: AuthenticatedRequest) {
    await this.google.disconnect(req.user.id);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Forçar sync com Google Calendar',
    description:
      'Dispara manualmente o sync backend→Google para slots e revisões pendentes/abertas do usuário autenticado.',
  })
  @ApiOkResponse({
    description: 'Sync disparado com sucesso.',
    schema: { example: { ok: true } },
  })
  @Post('sync')
  async forceSync(@Req() req: AuthenticatedRequest) {
    await this.google.forceSyncAllForUser(req.user.id);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Resync (hard) com Google Calendar',
    description:
      'Tenta apagar eventos existentes (pelos googleEventId salvos), zera os googleEventId no banco e recria tudo. Útil quando IDs ficaram inconsistentes. Pode deixar eventos órfãos se não for possível deletar no Google.',
  })
  @ApiQuery({
    name: 'confirm',
    required: true,
    description:
      'Obrigatório para evitar execução acidental. Use 1/true/yes para confirmar.',
  })
  @ApiOkResponse({
    description: 'Resync hard disparado com sucesso.',
    schema: { example: { ok: true } },
  })
  @Post('resync')
  async hardResync(
    @Req() req: AuthenticatedRequest,
    @Query('confirm') confirm?: string,
  ) {
    const confirmed =
      typeof confirm === 'string' &&
      ['1', 'true', 'yes'].includes(confirm.toLowerCase());

    if (!confirmed) {
      throw new BadRequestException(
        'Confirmação obrigatória: use ?confirm=1 para executar o resync hard.',
      );
    }

    await this.google.resetAndResyncAllForUser(req.user.id);
    return { ok: true };
  }
}
