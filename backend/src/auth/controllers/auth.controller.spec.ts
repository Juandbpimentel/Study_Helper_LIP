import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersService } from '@/users/users.service';
import { Request } from 'express';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { DiaSemana, Usuario } from '@prisma/client';
import { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import { OfensivaService } from '@/ofensiva/ofensiva.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: jest.Mocked<AuthService>;
  let usersServiceMock: jest.Mocked<UsersService>;
  let googleCalendarMock: jest.Mocked<
    Pick<
      GoogleCalendarService,
      'verifyAccessAndCleanupIfRevoked' | 'getBackendStatus'
    >
  >;
  let ofensivaServiceMock: jest.Mocked<Pick<OfensivaService, 'fromUsuario'>>;
  type ChangePasswordReq = Parameters<AuthController['changePassword']>[0];
  type ChangeEmailReq = Parameters<AuthController['changeEmail']>[0];
  type LoginReq = Parameters<AuthController['login']>[1];
  let user: Usuario;
  const authResult = {
    access_token: 'token-123',
    user: {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      versaoToken: 'v1',
      primeiroDiaSemana: DiaSemana.Dom,
      planejamentoRevisoes: [],
      maxSlotsPorDia: null,
      slotAtrasoToleranciaDias: 0,
      slotAtrasoMaxDias: 7,
      revisaoAtrasoExpiraDias: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  };

  const googleBackendStatus = {
    enabled: false,
    oauthConfigured: false,
    encryptionKeyConfigured: false,
    issues: ['GOOGLE_CLIENT_ID ausente'],
  };

  const ofensivaResumo = {
    atual: 0,
    bloqueiosTotais: 2,
    bloqueiosUsados: 0,
    bloqueiosRestantes: 2,
    ultimoDiaAtivo: null,
  } as const;

  let loginMock: jest.MockedFunction<
    (this: void, dto: LoginRequestDto) => Promise<typeof authResult>
  >;
  let registerMock: jest.MockedFunction<
    (this: void, dto: CreateUserDto) => Promise<typeof authResult>
  >;
  let loginFromGuardMock: jest.MockedFunction<
    (this: void, user: Usuario) => typeof authResult
  >;
  let changePasswordMock: jest.MockedFunction<
    (
      this: void,
      id: number,
      senhaAntiga: string,
      novaSenha: string,
    ) => Promise<Usuario>
  >;
  let changeEmailMock: jest.MockedFunction<
    (
      this: void,
      id: number,
      novoEmail: string,
      senha: string,
    ) => Promise<Usuario>
  >;
  beforeEach(() => {
    loginMock = jest.fn() as jest.MockedFunction<
      (this: void, dto: LoginRequestDto) => Promise<typeof authResult>
    >;
    registerMock = jest.fn() as jest.MockedFunction<
      (this: void, dto: CreateUserDto) => Promise<typeof authResult>
    >;
    loginFromGuardMock = jest.fn() as jest.MockedFunction<
      (this: void, user: Usuario) => typeof authResult
    >;

    loginMock.mockResolvedValue(authResult);
    registerMock.mockResolvedValue(authResult);
    loginFromGuardMock.mockReturnValue(authResult);

    authServiceMock = {
      login: loginMock,
      register: registerMock,
      loginFromGuard: loginFromGuardMock,
    } as unknown as jest.Mocked<AuthService>;

    changePasswordMock = jest.fn() as jest.MockedFunction<
      (
        this: void,
        id: number,
        senhaAntiga: string,
        novaSenha: string,
      ) => Promise<Usuario>
    >;
    changeEmailMock = jest.fn() as jest.MockedFunction<
      (
        this: void,
        id: number,
        novoEmail: string,
        senha: string,
      ) => Promise<Usuario>
    >;

    usersServiceMock = {
      changePassword: changePasswordMock,
      changeEmail: changeEmailMock,
    } as unknown as jest.Mocked<UsersService>;

    googleCalendarMock = {
      verifyAccessAndCleanupIfRevoked: jest.fn().mockResolvedValue(true),
      getBackendStatus: jest.fn().mockReturnValue(googleBackendStatus),
    };

    ofensivaServiceMock = {
      fromUsuario: jest.fn().mockReturnValue(ofensivaResumo),
    };

    controller = new AuthController(
      authServiceMock as unknown as AuthService,
      usersServiceMock as unknown as UsersService,
      googleCalendarMock,
      ofensivaServiceMock,
    );

    user = {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      senha: 'hashed',
      versaoToken: 'v1',
      primeiroDiaSemana: DiaSemana.Dom,
      planejamentoRevisoes: [],
      maxSlotsPorDia: null,
      slotAtrasoToleranciaDias: 0,
      slotAtrasoMaxDias: 7,
      revisaoAtrasoExpiraDias: null,
      ofensivaAtual: 0,
      ofensivaBloqueiosTotais: 2,
      ofensivaBloqueiosUsados: 0,
      ofensivaUltimoDiaAtivo: null,
      ofensivaAtualizadaEm: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
  });

  it('deve autenticar via login e retornar token', () => {
    const body: LoginRequestDto = { email: user.email, senha: 'secret' };

    const req: LoginReq = { user } as unknown as LoginReq;
    const result = controller.login(body, req);

    expect(loginFromGuardMock).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      message: 'Login Realizado com Sucesso',
      ...authResult,
      ofensiva: ofensivaResumo,
      googleCalendar: googleBackendStatus,
    });
  });

  it('deve registrar e retornar token + usuário', async () => {
    const body: CreateUserDto = {
      email: user.email,
      nome: user.nome,
      senha: 'secret',
    };

    const result = await controller.register(body);

    expect(registerMock).toHaveBeenCalledWith(body);
    expect(result).toEqual({
      message: 'Usuário registrado com sucesso',
      ...authResult,
      ofensiva: ofensivaResumo,
      googleCalendar: googleBackendStatus,
    });
  });

  it('deve trocar a senha e devolver novo token', async () => {
    const req: ChangePasswordReq = { user } as unknown as ChangePasswordReq;
    const body = { senhaAntiga: 'old', novaSenha: 'new' };
    const updatedUser = { ...user, senha: 'hashed-new' } as Usuario;
    changePasswordMock.mockResolvedValue(updatedUser);

    const result = await controller.changePassword(req, body);

    expect(changePasswordMock).toHaveBeenCalledWith(
      user.id,
      body.senhaAntiga,
      body.novaSenha,
    );
    expect(loginFromGuardMock).toHaveBeenCalledWith(updatedUser);
    expect(result).toEqual({
      message: 'Senha alterada com sucesso',
      ...authResult,
      ofensiva: ofensivaResumo,
    });
  });

  it('deve trocar o email e devolver novo token', async () => {
    const req: ChangeEmailReq = { user } as unknown as ChangeEmailReq;
    const body = { novoEmail: 'new@example.com', senha: 'secret' };
    const updatedUser = { ...user, email: body.novoEmail } as Usuario;
    changeEmailMock.mockResolvedValue(updatedUser);

    const result = await controller.changeEmail(req, body);

    expect(changeEmailMock).toHaveBeenCalledWith(
      user.id,
      body.novoEmail,
      body.senha,
    );
    expect(loginFromGuardMock).toHaveBeenCalledWith(updatedUser);
    expect(result).toEqual({
      message: 'Email alterado com sucesso',
      ...authResult,
      ofensiva: ofensivaResumo,
    });
  });

  it('deve limpar o cookie no logout', () => {
    const result = controller.logout();
    expect(result).toEqual({ message: 'Logout realizado com sucesso' });
  });

  it('token-only: does not depend on cookies', () => {
    const req = { headers: {} } as unknown as Request;
    void req;
    expect(controller.logout()).toEqual({
      message: 'Logout realizado com sucesso',
    });
  });
});
