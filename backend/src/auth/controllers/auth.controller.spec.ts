import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersService } from '@/users/users.service';
import { Response, Request } from 'express';
import { AUTH_COOKIE_NAME } from '../auth.constants';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { DiaSemana, Usuario } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: jest.Mocked<AuthService>;
  let usersServiceMock: jest.Mocked<UsersService>;
  // Use the exact parameter type for controller methods so tests match expected types
  type ChangePasswordReq = Parameters<AuthController['changePassword']>[0];
  type ChangeEmailReq = Parameters<AuthController['changeEmail']>[0];
  type LoginReq = Parameters<AuthController['login']>[1];
  let responseMock: jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>>;
  let user: Usuario;
  const authResult = {
    [AUTH_COOKIE_NAME]: 'token-123',
    user: {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      versaoToken: 'v1',
      primeiroDiaSemana: null,
      planejamentoRevisoes: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  };

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
    (this: void, id: number, novoEmail: string) => Promise<Usuario>
  >;
  let cookieMock: jest.MockedFunction<
    (this: void, name: string, value: string, options?: any) => void
  >;
  let clearCookieMock: jest.MockedFunction<(this: void, name: string) => void>;

  beforeEach(() => {
    // AuthService mocks - explicit this: void
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

    // UsersService mocks - explicit this: void
    changePasswordMock = jest.fn() as jest.MockedFunction<
      (
        this: void,
        id: number,
        senhaAntiga: string,
        novaSenha: string,
      ) => Promise<Usuario>
    >;
    changeEmailMock = jest.fn() as jest.MockedFunction<
      (this: void, id: number, novoEmail: string) => Promise<Usuario>
    >;

    usersServiceMock = {
      changePassword: changePasswordMock,
      changeEmail: changeEmailMock,
    } as unknown as jest.Mocked<UsersService>;

    // Response mocks - explicit this: void
    cookieMock = jest.fn() as jest.MockedFunction<
      (this: void, name: string, value: string, options?: any) => void
    >;
    clearCookieMock = jest.fn() as jest.MockedFunction<
      (this: void, name: string) => void
    >;

    responseMock = {
      cookie: cookieMock,
      clearCookie: clearCookieMock,
    } as unknown as jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>>;

    controller = new AuthController(
      authServiceMock as unknown as AuthService,
      usersServiceMock as unknown as UsersService,
    );

    user = {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      senha: 'hashed',
      versaoToken: 'v1',
      primeiroDiaSemana: DiaSemana.Dom,
      planejamentoRevisoes: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      isAdmin: false,
    };
  });
  it('deve autenticar via login e definir cookie', () => {
    const body: LoginRequestDto = { email: user.email, senha: 'secret' };

    const req: LoginReq = { user } as unknown as LoginReq;
    const result = controller.login(
      body,
      req,
      responseMock as unknown as Response,
    );

    expect(loginFromGuardMock).toHaveBeenCalledWith(user);
    expect(cookieMock).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      authResult[AUTH_COOKIE_NAME],
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toEqual({
      message: 'Login Realizado com Sucesso',
      ...authResult,
    });
  });

  it('deve registrar e retornar token + usuário', async () => {
    const body: CreateUserDto = {
      email: user.email,
      nome: user.nome,
      senha: 'secret',
    };

    const result = await controller.register(
      body,
      responseMock as unknown as Response,
    );

    expect(registerMock).toHaveBeenCalledWith(body);
    expect(cookieMock).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      authResult[AUTH_COOKIE_NAME],
      expect.any(Object),
    );
    expect(result).toEqual({
      message: 'Usuário registrado com sucesso',
      ...authResult,
    });
  });

  it('deve trocar a senha e devolver novo token', async () => {
    const req: ChangePasswordReq = { user } as unknown as ChangePasswordReq;
    const body = { senhaAntiga: 'old', novaSenha: 'new' };
    const updatedUser = { ...user, senha: 'hashed-new' } as Usuario;
    changePasswordMock.mockResolvedValue(updatedUser);

    const result = await controller.changePassword(
      req,
      body,
      responseMock as unknown as Response,
    );

    expect(changePasswordMock).toHaveBeenCalledWith(
      user.id,
      body.senhaAntiga,
      body.novaSenha,
    );
    expect(loginFromGuardMock).toHaveBeenCalledWith(updatedUser);
    expect(cookieMock).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      authResult[AUTH_COOKIE_NAME],
      expect.any(Object),
    );
    expect(result).toEqual({
      message: 'Senha alterada com sucesso',
      ...authResult,
    });
  });

  it('deve trocar o email e devolver novo token', async () => {
    const req: ChangeEmailReq = { user } as unknown as ChangeEmailReq;
    const body = { novoEmail: 'new@example.com', senha: 'secret' };
    const updatedUser = { ...user, email: body.novoEmail } as Usuario;
    changeEmailMock.mockResolvedValue(updatedUser);

    const result = await controller.changeEmail(
      req,
      body,
      responseMock as unknown as Response,
    );

    expect(changeEmailMock).toHaveBeenCalledWith(user.id, body.novoEmail);
    expect(loginFromGuardMock).toHaveBeenCalledWith(updatedUser);
    expect(cookieMock).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      authResult[AUTH_COOKIE_NAME],
      expect.any(Object),
    );
    expect(result).toEqual({
      message: 'Email alterado com sucesso',
      ...authResult,
    });
  });

  it('deve limpar o cookie no logout', () => {
    const result = controller.logout(responseMock as unknown as Response);

    expect(clearCookieMock).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
    expect(result).toEqual({ message: 'Logout realizado com sucesso' });
  });
});
