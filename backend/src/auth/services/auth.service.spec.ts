import { AuthService } from './auth.service';
import { UsersService } from '@/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AUTH_ACCESS_TOKEN_FIELD } from '@/auth/auth.constants';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '@/auth/dtos/create-user.dto';
import { LoginRequestDto } from '@/auth/dtos/login-request.dto';
import { Usuario } from '@prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const bcryptCompareMock = bcrypt.compare as jest.Mock;
  const bcryptHashMock = bcrypt.hash as jest.Mock;

  let service: AuthService;
  type UsersServiceMock = {
    findByEmail: jest.Mock;
    create: jest.Mock;
    rotateTokenVersion?: jest.Mock;
  };
  type JwtServiceMock = {
    sign: jest.Mock;
  };

  let usersServiceMock: UsersServiceMock;
  let jwtServiceMock: JwtServiceMock;
  let baseUser: Usuario;

  beforeEach(() => {
    usersServiceMock = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      rotateTokenVersion: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('signed-jwt'),
    };

    service = new AuthService(
      usersServiceMock as unknown as UsersService,
      jwtServiceMock as unknown as JwtService,
    );

    baseUser = {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      senha: 'hashed',
      versaoToken: 'v1',
      primeiroDiaSemana: null,
      planejamentoRevisoes: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    bcryptCompareMock.mockReset();
    bcryptHashMock.mockReset();
    jwtServiceMock.sign.mockClear();
  });

  describe('login', () => {
    it('deve retornar token e usuário público quando as credenciais são válidas', async () => {
      const dto: LoginRequestDto = { email: baseUser.email, senha: 'secret' };
      usersServiceMock.findByEmail.mockResolvedValue(baseUser);
      bcryptCompareMock.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result[AUTH_ACCESS_TOKEN_FIELD]).toBe('signed-jwt');
      expect(result.user).toEqual({
        id: baseUser.id,
        email: baseUser.email,
        nome: baseUser.nome,
        versaoToken: baseUser.versaoToken,
        primeiroDiaSemana: baseUser.primeiroDiaSemana,
        planejamentoRevisoes: baseUser.planejamentoRevisoes,
        createdAt: baseUser.createdAt,
        updatedAt: baseUser.updatedAt,
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        id: baseUser.id,
        email: baseUser.email,
        nome: baseUser.nome,
        versaoToken: baseUser.versaoToken,
        primeiroDiaSemana: baseUser.primeiroDiaSemana,
        planejamentoRevisoes: baseUser.planejamentoRevisoes,
      });
    });

    it('deve lançar UnauthorizedException quando as credenciais são inválidas', async () => {
      const dto: LoginRequestDto = { email: baseUser.email, senha: 'wrong' };
      usersServiceMock.findByEmail.mockResolvedValue(baseUser);
      bcryptCompareMock.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('loginFromGuard', () => {
    it('deve assinar o token usando o usuário já autenticado', () => {
      const result = service.loginFromGuard(baseUser);

      expect(result[AUTH_ACCESS_TOKEN_FIELD]).toBe('signed-jwt');
      expect(result.user.email).toBe(baseUser.email);
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(1);
    });
  });

  describe('register', () => {
    it('deve hashear a senha e retornar token + usuário público', async () => {
      const dto: CreateUserDto = {
        email: baseUser.email,
        nome: baseUser.nome,
        senha: 'plain-pass',
      };

      const createdUser: Usuario = { ...baseUser, senha: 'hashed-pass' };

      bcryptHashMock.mockResolvedValue('hashed-pass');
      usersServiceMock.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(bcryptHashMock).toHaveBeenCalledWith(dto.senha, 10);
      expect(usersServiceMock.create).toHaveBeenCalledWith({
        ...dto,
        senha: 'hashed-pass',
      });
      expect(result).toEqual({
        [AUTH_ACCESS_TOKEN_FIELD]: 'signed-jwt',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          nome: createdUser.nome,
          versaoToken: createdUser.versaoToken,
          primeiroDiaSemana: createdUser.primeiroDiaSemana,
          planejamentoRevisoes: createdUser.planejamentoRevisoes,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        },
      });
    });
  });
});
