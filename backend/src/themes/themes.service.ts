import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ListThemesQueryDto } from './dto/list-themes.dto';
import {
  buildMeta,
  getPagination,
  shouldPaginate,
} from '@/common/utils/pagination.utils';

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeHex(hex?: string): string | undefined {
    if (!hex) return undefined;
    const trimmed = hex.trim();
    if (!trimmed.startsWith('#')) return `#${trimmed}`.toUpperCase();
    return trimmed.toUpperCase();
  }

  async create(usuarioId: number, dto: CreateThemeDto) {
    const tema = dto.tema.trim();
    const descricao = dto.descricao?.trim() ?? undefined;
    const cor = this.normalizeHex(dto.cor);

    return await this.prisma.temaDeEstudo.create({
      data: {
        tema,
        descricao,
        cor,
        creatorId: usuarioId,
      },
    });
  }

  async findAll(usuarioId: number, query?: ListThemesQueryDto) {
    const where = { creatorId: usuarioId };
    const orderBy = { tema: 'asc' } as const;
    const include = {
      _count: {
        select: { slots: true, registros: true },
      },
    };

    if (!query || !shouldPaginate(query)) {
      return await this.prisma.temaDeEstudo.findMany({
        where,
        orderBy,
        include,
      });
    }

    const { skip, take, page, pageSize } = getPagination(query, {
      page: 1,
      pageSize: 50,
    });

    const [items, total] = await this.prisma.$transaction([
      this.prisma.temaDeEstudo.findMany({
        where,
        orderBy,
        include,
        skip,
        take,
      }),
      this.prisma.temaDeEstudo.count({ where }),
    ]);

    return {
      items,
      meta: buildMeta({ total, page, pageSize }),
    };
  }

  async findOne(usuarioId: number, id: number) {
    const tema = await this.prisma.temaDeEstudo.findFirst({
      where: { id, creatorId: usuarioId },
      include: {
        slots: true,
        registros: {
          take: 5,
          orderBy: { dataEstudo: 'desc' },
        },
      },
    });
    if (!tema)
      throw new NotFoundException(
        'Tema de estudo não encontrado para o usuário',
      );
    return tema;
  }

  async update(usuarioId: number, id: number, dto: UpdateThemeDto) {
    await this.ensureOwnership(usuarioId, id);
    return await this.prisma.temaDeEstudo.update({
      where: { id },
      data: {
        tema: dto.tema?.trim(),
        descricao: dto.descricao?.trim(),
        cor: this.normalizeHex(dto.cor),
      },
    });
  }

  async remove(usuarioId: number, id: number) {
    await this.ensureOwnership(usuarioId, id);
    return await this.prisma.temaDeEstudo.delete({ where: { id } });
  }

  private async ensureOwnership(usuarioId: number, id: number) {
    const tema = await this.prisma.temaDeEstudo.findFirst({
      where: { id, creatorId: usuarioId },
      select: { id: true },
    });
    if (!tema)
      throw new NotFoundException(
        'Tema de estudo não encontrado para o usuário',
      );
    return tema;
  }
}
