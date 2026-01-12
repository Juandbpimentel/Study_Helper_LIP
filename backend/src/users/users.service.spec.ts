import { UsersService } from './users.service';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DiaSemana, Usuario } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import type { CreateUserDto } from '@/auth/dtos/create-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock<typeof import('crypto')>('crypto', () => {
  const actual = jest.requireActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    randomUUID: jest.fn(),
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: {
    usuario: {
      findUnique: jest.Mock<
        Promise<Usuario | null>,
        [Prisma.UsuarioFindUniqueArgs]
      >;
      findFirst: jest.Mock<
        Promise<{ id: number } | null>,
        [Prisma.UsuarioFindFirstArgs]
      >;
      update: jest.Mock<Promise<Usuario>, [Prisma.UsuarioUpdateArgs]>;
      create: jest.Mock<Promise<Usuario>, [Prisma.UsuarioCreateArgs]>;
      findMany: jest.Mock<Promise<Usuario[]>, [Prisma.UsuarioFindManyArgs]>;
      delete: jest.Mock<Promise<Usuario>, [Prisma.UsuarioDeleteArgs]>;
    };
  };
  let baseUser: Usuario;
  let googleCalendarMock: Pick<
    GoogleCalendarService,
    'deleteSlotEventsByEventIds' | 'deleteRevisionEventsByEventIds'
  >;

  beforeEach(() => {
    prismaMock = {
      usuario: {
        findUnique: jest.fn<
          Promise<Usuario | null>,
          [Prisma.UsuarioFindUniqueArgs]
        >(),
        findFirst: jest.fn<
          Promise<{ id: number } | null>,
          [Prisma.UsuarioFindFirstArgs]
        >(),
        update: jest.fn<Promise<Usuario>, [Prisma.UsuarioUpdateArgs]>(),
        create: jest.fn<Promise<Usuario>, [Prisma.UsuarioCreateArgs]>(),
        findMany: jest.fn<Promise<Usuario[]>, [Prisma.UsuarioFindManyArgs]>(),
        delete: jest.fn<Promise<Usuario>, [Prisma.UsuarioDeleteArgs]>(),
      },
    };

    googleCalendarMock = {
      deleteSlotEventsByEventIds: jest.fn(),
      deleteRevisionEventsByEventIds: jest.fn(),
    };

    service = new UsersService(
      prismaMock as unknown as PrismaService,
      googleCalendarMock as unknown as GoogleCalendarService,
    );

    baseUser = {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      senha: 'hashed-old',
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

    jest.spyOn(bcrypt, 'compare').mockReset();
    jest.spyOn(bcrypt, 'hash').mockReset();
    (crypto.randomUUID as jest.Mock).mockReset();
  });

  describe('create', () => {
    it('should normalize email and create user', async () => {
      const dto: CreateUserDto = {
        email: ' JOHN@EXAMPLE.COM ',
        nome: 'John',
        senha: 'hashed',
      };
      const created: Usuario = { ...baseUser, email: 'john@example.com' };
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaMock.usuario.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'john@example.com', mode: 'insensitive' } },
        select: { id: true },
      });
      expect(prismaMock.usuario.create).toHaveBeenCalledWith({
        data: { ...dto, email: 'john@example.com' },
      });
      expect(result.email).toBe('john@example.com');
    });

    it('should throw BadRequestException when email already in use (pre-check)', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue({ id: 123 });

      await expect(
        service.create({
          email: 'x@example.com',
          nome: 'X',
          senha: 's',
        }),
      ).rejects.toThrow('A propriedade email deve ser única');
    });

    it('should throw BadRequestException on P2002 (race condition fallback)', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);
      prismaMock.usuario.create.mockRejectedValue({
        code: 'P2002',
        meta: { constraint: { fields: ['email'] } },
      });

      await expect(
        service.create({
          email: 'x@example.com',
          nome: 'X',
          senha: 's',
        }),
      ).rejects.toThrow('A propriedade email deve ser única');
    });
  });

  describe('changePassword', () => {
    it('should update password and rotate versaoToken on success', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true); // senha antiga válida
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false); // nova senha diferente
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
      const mockUUIDV2 = '00000000-0000-0000-0000-000000000002';
      (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUIDV2);

      const updated: Usuario = {
        ...baseUser,
        senha: 'hashed-new',
        versaoToken: mockUUIDV2,
      };
      prismaMock.usuario.update.mockResolvedValue(updated);

      const result = await service.changePassword(baseUser.id, 'old', 'new');

      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: baseUser.id },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('old', baseUser.senha);
      expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: baseUser.id },
        data: { senha: 'hashed-new', versaoToken: mockUUIDV2 },
      });
      expect(result.versaoToken).toBe(mockUUIDV2);
    });

    it('should throw if user not found', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(999, 'old', 'new')).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('should throw if old password invalid', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(baseUser.id, 'wrong', 'new'),
      ).rejects.toThrow('Senha antiga inválida');
    });
  });
  describe('changeEmail', () => {
    it('should update email and rotate versaoToken on success', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(baseUser);
      prismaMock.usuario.findFirst.mockResolvedValue(null); // email não em uso
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // senha válida
      const mockUUIDV3 = '00000000-0000-0000-0000-000000000003';
      (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUIDV3);
      const updated: Usuario = {
        ...baseUser,
        email: 'new@example.com',
        versaoToken: mockUUIDV3,
      };
      prismaMock.usuario.update.mockResolvedValue(updated);

      const result = await service.changeEmail(
        baseUser.id,
        'new@example.com',
        'secret',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('secret', baseUser.senha);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: baseUser.id },
        data: { email: 'new@example.com', versaoToken: mockUUIDV3 },
      });
      expect(result.versaoToken).toBe(mockUUIDV3);
    });
  });
});
