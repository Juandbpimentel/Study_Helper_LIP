import {
  Controller,
  Post,
  UseGuards,
  Body,
  Patch,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { UsersService } from '@/users/users.service';
import { Response, Request } from 'express';
import { AUTH_COOKIE_NAME } from '../auth.constants';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { ChangeUserPasswordDto } from '../dtos/change-user-password.dto';
import { ChangeUserEmailDto } from '../dtos/change-user-email.dto';

import { AuthenticatedRequest } from '../types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  private setCookie(res: Response, token: string, origin?: string) {
    const isCrossSite =
      typeof origin === 'string' && !origin.includes('localhost');
    const cookieOptions = {
      httpOnly: true,
      secure: isCrossSite,
      sameSite: isCrossSite ? ('none' as const) : ('lax' as const),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Body() body: LoginRequestDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = this.authService.loginFromGuard(req.user);
    const token = authResult[AUTH_COOKIE_NAME] as string;
    const origin = req.get('origin');
    this.setCookie(res, token, origin);
    return { message: 'Login Realizado com Sucesso', ...authResult };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const origin = req.get('origin');
    const isCrossSite =
      typeof origin === 'string' && !origin.includes('localhost');
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isCrossSite,
      sameSite: isCrossSite ? ('none' as const) : ('lax' as const),
    });
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('register')
  async register(
    @Body() body: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = await this.authService.register(body);

    const token = authResult[AUTH_COOKIE_NAME] as string;
    const origin = req.get('origin');
    this.setCookie(res, token, origin);
    return { message: 'Usuário registrado com sucesso', ...authResult };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    const payload = {
      id: req.user.id,
      email: req.user.email,
      nome: req.user.nome,
      versaoToken: req.user.versaoToken,
      primeiroDiaSemana: req.user.primeiroDiaSemana,
      planejamentoRevisoes: req.user.planejamentoRevisoes,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };
    return payload;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangeUserPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const updated = await this.usersService.changePassword(
      req.user.id,
      body.senhaAntiga,
      body.novaSenha,
    );
    const authResult = this.authService.loginFromGuard(updated);
    const token = authResult[AUTH_COOKIE_NAME] as string;
    const origin = req.get('origin');
    this.setCookie(res, token, origin);
    return { message: 'Senha alterada com sucesso', ...authResult };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-email')
  async changeEmail(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangeUserEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const updated = await this.usersService.changeEmail(
      req.user.id,
      body.novoEmail,
      body.senha,
    );
    const authResult = this.authService.loginFromGuard(updated);
    const token = authResult[AUTH_COOKIE_NAME] as string;
    const origin = req.headers.origin;
    this.setCookie(res, token, origin);
    return { message: 'Email alterado com sucesso', ...authResult };
  }
}
