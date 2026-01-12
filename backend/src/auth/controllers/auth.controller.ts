import {
  Controller,
  Post,
  UseGuards,
  Body,
  Patch,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { UsersService } from '@/users/users.service';
import { Request } from 'express';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { ChangeUserPasswordDto } from '../dtos/change-user-password.dto';
import { ChangeUserEmailDto } from '../dtos/change-user-email.dto';

import { AuthenticatedRequest, LoginRequest } from '../types';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthProfileResponseDto,
  AuthSuccessResponseDto,
  LogoutResponseDto,
} from '../dtos/auth-response.dto';
import { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import { OfensivaService } from '@/ofensiva/ofensiva.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private googleCalendar: GoogleCalendarService,
    private ofensivaService: OfensivaService,
  ) {}

  private getGoogleCalendarBackendStatus() {
    return this.googleCalendar.getBackendStatus();
  }

  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Valida as credenciais informadas e emite um token JWT.\n\nBody (JSON):\n- email (string): email cadastrado\n- senha (string): senha do usuário (mín. 6; regra forte é validada no cadastro)',
  })
  @ApiBody({
    type: LoginRequestDto,
    description:
      'Campos do body (JSON):\n- email: email cadastrado\n- senha: senha do usuário',
  })
  @ApiOkResponse({
    description:
      'Credenciais válidas. Retorna o token JWT e os dados públicos do usuário autenticado.',
    type: AuthSuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas ou usuário não encontrado.',
  })
  @ApiBadRequestResponse({
    description: 'Falha de validação nos campos informados.',
  })
  @Post('login')
  login(@Body() body: LoginRequestDto, @Req() req: LoginRequest) {
    const authResult = this.authService.loginFromGuard(req.user);

    void this.googleCalendar.verifyAccessAndCleanupIfRevoked(req.user.id);

    const ofensiva = this.ofensivaService.fromUsuario(req.user);

    return {
      message: 'Login Realizado com Sucesso',
      ...authResult,
      ofensiva,
      googleCalendar: this.getGoogleCalendarBackendStatus(),
    };
  }

  @ApiOperation({
    summary: 'Encerrar sessão atual',
    description:
      'Token-only: o logout é responsabilidade do cliente (ex.: limpar o token do localStorage).',
  })
  @ApiOkResponse({
    description: 'Sessão encerrada no cliente com sucesso.',
    type: LogoutResponseDto,
  })
  @Post('logout')
  logout() {
    return { message: 'Logout realizado com sucesso' };
  }

  @ApiOperation({
    summary: 'Registrar novo usuário',
    description:
      'Cria uma conta e gera o token JWT inicial.\n\nBody (JSON):\n- nome (string)\n- email (string)\n- senha (string): forte (mín. 6, com maiúsculas/minúsculas/números/símbolos)',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Campos do body (JSON):\n- nome\n- email\n- senha (forte)',
  })
  @ApiCreatedResponse({
    description:
      'Usuário criado, token emitido e sessão autenticada imediatamente.',
    type: AuthSuccessResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha de validação ou senha fora dos requisitos mínimos.',
  })
  @ApiConflictResponse({
    description: 'Email informado já está em uso.',
  })
  @Post('register')
  async register(@Body() body: CreateUserDto) {
    const authResult = await this.authService.register(body);

    const ofensiva = this.ofensivaService.fromUsuario(authResult.user);

    return {
      message: 'Usuário registrado com sucesso',
      ...authResult,
      ofensiva,
      googleCalendar: this.getGoogleCalendarBackendStatus(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Recuperar perfil autenticado',
    description:
      'Retorna dados essenciais do usuário autenticado usando o token presente no header Authorization (Bearer).',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Perfil recuperado com sucesso.',
    type: AuthProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado.',
  })
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    const ofensiva = this.ofensivaService.fromUsuario(req.user);
    const payload = {
      id: req.user.id,
      email: req.user.email,
      nome: req.user.nome,
      versaoToken: req.user.versaoToken,
      primeiroDiaSemana: req.user.primeiroDiaSemana,
      planejamentoRevisoes: req.user.planejamentoRevisoes,
      maxSlotsPorDia: req.user.maxSlotsPorDia ?? null,
      slotAtrasoToleranciaDias: req.user.slotAtrasoToleranciaDias,
      slotAtrasoMaxDias: req.user.slotAtrasoMaxDias,
      revisaoAtrasoExpiraDias: req.user.revisaoAtrasoExpiraDias ?? null,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
      ofensiva,
    };
    return payload;
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Trocar senha do usuário',
    description:
      'Valida a senha atual, atualiza a senha e rota o token do usuário, retornando o novo JWT.\n\nBody (JSON):\n- senhaAntiga (string)\n- novaSenha (string): forte (mín. 6, com maiúsculas/minúsculas/números/símbolos)',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: ChangeUserPasswordDto,
    description: 'Campos do body (JSON):\n- senhaAntiga\n- novaSenha',
  })
  @ApiOkResponse({
    description: 'Senha alterada com sucesso e novo token emitido.',
    type: AuthSuccessResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Nova senha inválida, igual à anterior ou violação de regras de negócio.',
  })
  @ApiUnauthorizedResponse({
    description: 'Senha atual incorreta ou token inválido.',
  })
  @Patch('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangeUserPasswordDto,
  ) {
    const updated = await this.usersService.changePassword(
      req.user.id,
      body.senhaAntiga,
      body.novaSenha,
    );
    const authResult = this.authService.loginFromGuard(updated);
    return {
      message: 'Senha alterada com sucesso',
      ...authResult,
      ofensiva: this.ofensivaService.fromUsuario(updated),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Trocar email do usuário',
    description:
      'Valida a senha atual, garante unicidade do novo email e devolve um novo token JWT atualizado.\n\nBody (JSON):\n- senha (string)\n- novoEmail (string)',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: ChangeUserEmailDto,
    description: 'Campos do body (JSON):\n- senha\n- novoEmail',
  })
  @ApiOkResponse({
    description: 'Email alterado com sucesso e novo token emitido.',
    type: AuthSuccessResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Novo email inválido ou já utilizado por outro usuário.',
  })
  @ApiUnauthorizedResponse({
    description: 'Senha atual inválida ou token expirado.',
  })
  @Patch('change-email')
  async changeEmail(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangeUserEmailDto,
  ) {
    const updated = await this.usersService.changeEmail(
      req.user.id,
      body.novoEmail,
      body.senha,
    );
    const authResult = this.authService.loginFromGuard(updated);
    return {
      message: 'Email alterado com sucesso',
      ...authResult,
      ofensiva: this.ofensivaService.fromUsuario(updated),
    };
  }
}
