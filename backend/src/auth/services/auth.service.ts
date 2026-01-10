import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '@prisma/client';
import { CreateUserDto } from '@/auth/dtos/create-user.dto';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { AUTH_ACCESS_TOKEN_FIELD } from '@/auth/auth.constants';

type PublicUser = Omit<Usuario, 'senha'>;

export type AuthResult = {
  [AUTH_ACCESS_TOKEN_FIELD]: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  private readonly usersService: UsersService;
  private readonly jwtService: JwtService;

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  constructor(usersService: UsersService, jwtService: JwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  private signToken(user: Usuario) {
    const payload = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      versaoToken: user.versaoToken,
      primeiroDiaSemana: user.primeiroDiaSemana,
      planejamentoRevisoes: user.planejamentoRevisoes,
    };
    return this.jwtService.sign(payload);
  }

  private buildPublicUser(user: Usuario): PublicUser {
    const { senha, ...publicUser } = user;
    void senha;
    return publicUser;
  }

  private buildAuthResult(user: Usuario): AuthResult {
    return {
      [AUTH_ACCESS_TOKEN_FIELD]: this.signToken(user),
      user: this.buildPublicUser(user),
    };
  }

  async validateUser(email: string, senha: string): Promise<Usuario | null> {
    const normalizedEmail = this.normalizeEmail(email);
    // pedir a senha explicitamente para validar
    const user = await this.usersService.findByEmail(normalizedEmail, {
      withPassword: true,
    });

    if (user && (await bcrypt.compare(senha, user.senha))) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async login(dto: LoginRequestDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const validated = await this.validateUser(normalizedEmail, dto.senha);
    if (!validated)
      throw new UnauthorizedException('Usuário ou senha inválidos');
    return this.buildAuthResult(validated);
  }

  loginFromGuard(user: Usuario) {
    return this.buildAuthResult(user);
  }

  async register(dto: CreateUserDto) {
    const hashed = await bcrypt.hash(dto.senha, 10);
    const user = await this.usersService.create({
      ...dto,
      senha: hashed,
    });

    return this.buildAuthResult(user);
  }
}
