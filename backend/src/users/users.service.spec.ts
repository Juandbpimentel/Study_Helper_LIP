import { UsersService } from './users.service';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DiaSemana, Usuario } from '@prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: {
    usuario: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      delete: jest.Mock;
    };
  };
  let baseUser: Usuario;

  beforeEach(() => {
    prismaMock = {
      usuario: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new UsersService(prismaMock as unknown as PrismaService);

    baseUser = {
      id: 1,
      email: 'john@example.com',
      nome: 'John',
      senha: 'hashed-old',
      versaoToken: 'v1',
      primeiroDiaSemana: DiaSemana.Dom,
      planejamentoRevisoes: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      isAdmin: false,
    };

    jest.spyOn(bcrypt, 'compare').mockReset();
    jest.spyOn(bcrypt, 'hash').mockReset();
    (crypto.randomUUID as jest.Mock).mockReset();
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
