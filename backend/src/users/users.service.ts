import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from '@/auth/dtos/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { Usuario } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ListUsersQueryDto } from './dto/list-users.dto';
import {
  buildMeta,
  getPagination,
  shouldPaginate,
} from '@/common/utils/pagination.utils';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async create(createUserDto: CreateUserDto): Promise<Usuario> {
    const email = this.normalizeEmail(createUserDto.email);
    return await this.prisma.usuario.create({
      data: { ...createUserDto, email },
    });
  }

  async findAll(query?: ListUsersQueryDto): Promise<Usuario[] | any> {
    if (!query || !shouldPaginate(query)) {
      return await this.prisma.usuario.findMany();
    }

    const { skip, take, page, pageSize } = getPagination(query, {
      page: 1,
      pageSize: 50,
    });

    const [items, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({ skip, take }),
      this.prisma.usuario.count(),
    ]);

    return {
      items,
      meta: buildMeta({ total, page, pageSize }),
    };
  }

  async findOne(id: number): Promise<Usuario | null> {
    return await this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  // Sobrecarrega o método findByEmail para definir o retorno como Usuario, Omit<Usuario> ou null, para retornar o usuário com ou sem a senha
  async findByEmail(
    email: string,
    options: { withPassword: true },
  ): Promise<Usuario>;

  async findByEmail(
    email: string,
    options?: { withPassword?: false },
  ): Promise<Omit<Usuario, 'senha'> | null>;

  async findByEmail(
    email: string,
    options?: { withPassword?: boolean },
  ): Promise<Usuario | Omit<Usuario, 'senha'> | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!usuario) {
      return null;
    }

    if (options?.withPassword) {
      return usuario;
    }

    const { senha: senhaHash, ...usuarioSemSenha } = usuario;
    void senhaHash;
    return usuarioSemSenha;
  }

  async rotateTokenVersion(id: number): Promise<string> {
    const versaoAtualizada = randomUUID();
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { versaoToken: versaoAtualizada },
      select: { versaoToken: true },
    });
    return usuario.versaoToken;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Usuario> {
    return await this.prisma.usuario.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async changePassword(
    id: number,
    senhaAntiga: string,
    novaSenha: string,
  ): Promise<Usuario> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    const senhaValida = await bcrypt.compare(senhaAntiga, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha antiga inválida');
    }
    const mesmaSenha = await bcrypt.compare(novaSenha, usuario.senha);
    if (mesmaSenha) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha antiga',
      );
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    const novaVersao = randomUUID();
    return await this.prisma.usuario.update({
      where: { id },
      data: { senha: novaSenhaHash, versaoToken: novaVersao },
    });
  }

  async changeEmail(
    id: number,
    novoEmail: string,
    senhaAtual: string,
  ): Promise<Usuario> {
    const emailNormalizado = this.normalizeEmail(novoEmail);
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (usuario.email.toLowerCase() === emailNormalizado.toLowerCase()) {
      throw new BadRequestException(
        'O novo email deve ser diferente do email atual',
      );
    }

    const emailEmUso = await this.prisma.usuario.findFirst({
      where: {
        email: { equals: emailNormalizado, mode: 'insensitive' },
        NOT: { id },
      },
      select: { id: true },
    });

    if (emailEmUso) {
      throw new BadRequestException('O email já está em uso por outro usuário');
    }
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha inválida');
    }
    const novaVersao = randomUUID();
    return await this.prisma.usuario.update({
      where: { id },
      data: { email: emailNormalizado, versaoToken: novaVersao },
    });
  }

  async remove(id: number): Promise<Usuario> {
    return await this.prisma.usuario.delete({
      where: { id },
    });
  }

  async updateRole(id: number, isAdmin: boolean): Promise<Usuario> {
    return await this.prisma.usuario.update({
      where: { id },
      data: { isAdmin },
    });
  }
}
