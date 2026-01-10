import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';

type JwtPayload = {
  id: number;
  versaoToken: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private usersService: UsersService) {
    super({
      // Token-only: o frontend envia Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usersService.findOneForAuthContext(payload.id);
    if (!usuario || usuario.versaoToken !== payload.versaoToken) {
      throw new UnauthorizedException('Sessão inválida ou expirando');
    }
    return usuario;
  }
}
