import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import { RegistrosService } from '@/registros/registros.service';
import { ConcluirRevisaoDto } from './dto/concluir-revisao.dto';
import { AdiarRevisaoDto } from './dto/adiar-revisao.dto';
import { ListarRevisoesQueryDto } from './dto/listar-revisoes.dto';
import { Prisma, StatusRevisao, TipoRegistro } from '@prisma/client';
import { addDays, parseISODate, startOfDay } from '@/common/utils/date.utils';
import {
  buildMeta,
  getPagination,
  shouldPaginate,
} from '@/common/utils/pagination.utils';

@Injectable()
export class RevisoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
    @Inject(forwardRef(() => RegistrosService))
    private readonly registrosService: RegistrosService,
  ) {}

  async listar(usuarioId: number, query: ListarRevisoesQueryDto) {
    await this.atualizarStatusAutomatico(usuarioId);

    const where: Prisma.RevisaoProgramadaWhereInput = {
      creatorId: usuarioId,
    };

    if (query.status) {
      where.statusRevisao = query.status;
    }

    if (query.dataInicial || query.dataFinal) {
      const dataInicial = query.dataInicial
        ? parseISODate(query.dataInicial)
        : undefined;
      const dataFinal = query.dataFinal
        ? parseISODate(query.dataFinal)
        : undefined;

      if (query.dataInicial && !dataInicial)
        throw new BadRequestException('Data inicial inválida');
      if (query.dataFinal && !dataFinal)
        throw new BadRequestException('Data final inválida');

      where.dataRevisao = {
        ...(dataInicial ? { gte: startOfDay(dataInicial) } : {}),
        ...(dataFinal ? { lt: addDays(startOfDay(dataFinal), 1) } : {}),
      };
    }

    const orderBy = { dataRevisao: 'asc' } as const;
    const include = {
      registroOrigem: {
        include: {
          tema: true,
          slotCronograma: {
            include: { tema: true },
          },
        },
      },
      registroConclusao: true,
    };

    if (!shouldPaginate(query)) {
      return await this.prisma.revisaoProgramada.findMany({
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
      this.prisma.revisaoProgramada.findMany({
        where,
        orderBy,
        include,
        skip,
        take,
      }),
      this.prisma.revisaoProgramada.count({ where }),
    ]);

    return {
      items,
      meta: buildMeta({ total, page, pageSize }),
    };
  }

  async remover(usuarioId: number, revisaoId: number) {
    const revisao = await this.prisma.revisaoProgramada.findFirst({
      where: { id: revisaoId, creatorId: usuarioId },
      select: { id: true, googleEventId: true },
    });
    if (!revisao)
      throw new NotFoundException('Revisão programada não encontrada');

    const eventId = revisao.googleEventId;
    const removida = await this.prisma.revisaoProgramada.delete({
      where: { id: revisaoId },
    });

    if (eventId) {
      await this.googleCalendar.deleteRevisionEventsByEventIds(usuarioId, [
        eventId,
      ]);
    }

    return removida;
  }

  async concluir(
    usuarioId: number,
    revisaoId: number,
    dto: ConcluirRevisaoDto,
  ) {
    const revisaoConcluida = await this.prisma.$transaction(async (tx) => {
      const revisao = await tx.revisaoProgramada.findFirst({
        where: { id: revisaoId, creatorId: usuarioId },
        include: {
          registroOrigem: {
            select: {
              temaId: true,
              slotId: true,
            },
          },
        },
      });
      if (!revisao) {
        throw new NotFoundException('Revisão programada não encontrada');
      }

      await this.registrosService.criarComTx(tx, usuarioId, {
        tipoRegistro: TipoRegistro.Revisao,
        tempoDedicado: dto.tempoDedicado,
        conteudoEstudado: dto.conteudoEstudado,
        dataEstudo: dto.dataEstudo,
        revisaoProgramadaId: revisao.id,
        temaId: revisao.registroOrigem.temaId ?? undefined,
        slotId: revisao.registroOrigem.slotId ?? undefined,
      });

      await this.atualizarStatusAutomatico(usuarioId, tx);

      return await tx.revisaoProgramada.findUnique({
        where: { id: revisao.id },
        include: {
          registroOrigem: true,
          registroConclusao: true,
        },
      });
    });

    // Fora da transação: Deleta/atualiza evento no Google conforme status final.
    await this.googleCalendar.syncRevisionById(usuarioId, revisaoId);

    return revisaoConcluida;
  }

  async adiar(usuarioId: number, revisaoId: number, dto: AdiarRevisaoDto) {
    const novaData = parseISODate(dto.novaData);
    if (!novaData)
      throw new BadRequestException('Data inválida para adiamento');
    const revisao = await this.prisma.revisaoProgramada.findFirst({
      where: { id: revisaoId, creatorId: usuarioId },
    });
    if (!revisao)
      throw new NotFoundException('Revisão programada não encontrada');
    if (revisao.statusRevisao === StatusRevisao.Concluida)
      throw new BadRequestException('Revisão concluída não pode ser adiada');

    const dataNormalizada = startOfDay(novaData);
    const revisaoAtualizada = await this.prisma.$transaction(async (tx) => {
      await tx.revisaoProgramada.update({
        where: { id: revisaoId },
        data: {
          dataRevisao: dataNormalizada,
          statusRevisao: StatusRevisao.Adiada,
        },
      });

      await this.atualizarStatusAutomatico(usuarioId, tx);

      return await tx.revisaoProgramada.findUnique({
        where: { id: revisaoId },
      });
    });

    await this.googleCalendar.syncRevisionById(usuarioId, revisaoId);

    return revisaoAtualizada;
  }

  async atualizarStatusAutomaticoTodosUsuarios(): Promise<void> {
    const usuarios = await this.prisma.usuario.findMany({
      select: { id: true },
    });

    for (const u of usuarios) {
      await this.atualizarStatusAutomatico(u.id);
    }
  }

  async atualizarStatusAutomatico(
    usuarioId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const hoje = startOfDay(new Date());

    const prefs = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { revisaoAtrasoExpiraDias: true },
    });
    const expiraDias = prefs?.revisaoAtrasoExpiraDias ?? null;

    await db.revisaoProgramada.updateMany({
      where: {
        creatorId: usuarioId,
        statusRevisao: { in: [StatusRevisao.Pendente, StatusRevisao.Adiada] },
        dataRevisao: { lt: hoje },
      },
      data: { statusRevisao: StatusRevisao.Atrasada },
    });

    if (expiraDias && expiraDias > 0) {
      const limiteExpiracao = addDays(hoje, -expiraDias);
      await db.revisaoProgramada.updateMany({
        where: {
          creatorId: usuarioId,
          statusRevisao: StatusRevisao.Atrasada,
          dataRevisao: { lt: limiteExpiracao },
        },
        data: { statusRevisao: StatusRevisao.Expirada },
      });
    }

    await db.revisaoProgramada.updateMany({
      where: {
        creatorId: usuarioId,
        statusRevisao: StatusRevisao.Atrasada,
        dataRevisao: { gte: hoje },
      },
      data: { statusRevisao: StatusRevisao.Pendente },
    });
  }
}
