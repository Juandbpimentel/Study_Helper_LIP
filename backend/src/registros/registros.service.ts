import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
import {
  CreateRegistroDto,
  ListRegistrosQueryDto,
} from './dto/create-registro.dto';
import { Prisma, StatusRevisao, TipoRegistro } from '@prisma/client';
import { addDays, parseISODate, startOfDay } from '@/common/utils/date.utils';
import {
  buildMeta,
  getPagination,
  shouldPaginate,
} from '@/common/utils/pagination.utils';
import { OfensivaService } from '@/common/services/ofensiva.service';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly ofensivaService: OfensivaService,
  ) {}

  async listar(usuarioId: number, query: ListRegistrosQueryDto) {
    const filtros: Prisma.RegistroEstudoWhereInput = {
      creatorId: usuarioId,
    };

    if (query.data) {
      const data = parseISODate(query.data);
      if (!data) {
        throw new BadRequestException('Data inválida');
      }
      const inicio = startOfDay(data);
      const fim = addDays(inicio, 1);
      filtros.dataEstudo = { gte: inicio, lt: fim };
    }

    const orderBy = { dataEstudo: 'desc' } as const;
    const include = {
      tema: true,
      slotCronograma: {
        include: { tema: true },
      },
      revisoesGeradas: true,
      revisaoConcluida: true,
    };

    if (!shouldPaginate(query)) {
      return await this.prisma.registroEstudo.findMany({
        where: filtros,
        orderBy,
        include,
      });
    }

    const { skip, take, page, pageSize } = getPagination(query, {
      page: 1,
      pageSize: 50,
    });

    const [items, total] = await this.prisma.$transaction([
      this.prisma.registroEstudo.findMany({
        where: filtros,
        orderBy,
        include,
        skip,
        take,
      }),
      this.prisma.registroEstudo.count({ where: filtros }),
    ]);

    return {
      items,
      meta: buildMeta({ total, page, pageSize }),
    };
  }

  async criar(usuarioId: number, dto: CreateRegistroDto) {
    const { registro, revisoesCriadasIds } = await this.prisma.$transaction(
      async (tx) => this.criarComTx(tx, usuarioId, dto),
    );

    if (revisoesCriadasIds.length) {
      await Promise.all(
        revisoesCriadasIds.map((id) =>
          this.googleCalendar.syncRevisionById(usuarioId, id),
        ),
      );
    }

    // Atualiza ofensiva no banco para feedback imediato.
    void this.ofensivaService.recalcularEAtualizar(usuarioId);

    return registro;
  }

  async remover(usuarioId: number, registroId: number) {
    const registro = await this.prisma.registroEstudo.findFirst({
      where: { id: registroId, creatorId: usuarioId },
      include: {
        revisoesGeradas: { select: { googleEventId: true } },
        revisaoConcluida: { select: { id: true } },
      },
    });
    if (!registro)
      throw new NotFoundException(
        'Registro de estudo não encontrado para o usuário',
      );

    const eventIds = (registro.revisoesGeradas ?? [])
      .map((r) => r.googleEventId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    // Se esse registro concluiu uma revisão, reabre a revisão antes de apagar para não violar FK.
    const revisoesParaRessincronizar: number[] = [];

    const removido = await this.prisma.$transaction(async (tx) => {
      const revisoesConcluidas = await tx.revisaoProgramada.findMany({
        where: { creatorId: usuarioId, registroConclusaoId: registroId },
        select: { id: true },
      });

      if (revisoesConcluidas.length) {
        revisoesParaRessincronizar.push(...revisoesConcluidas.map((r) => r.id));
        await tx.revisaoProgramada.updateMany({
          where: { id: { in: revisoesConcluidas.map((r) => r.id) } },
          data: {
            registroConclusaoId: null,
            statusRevisao: StatusRevisao.Pendente,
          },
        });
      }

      // DB first: remove registro (revisões geradas devem cair por cascade em registroOrigem).
      return await tx.registroEstudo.delete({
        where: { id: registroId },
      });
    });

    // Fora da transação: best-effort para limpar eventos de revisões que foram removidas.
    if (eventIds.length) {
      await this.googleCalendar.deleteRevisionEventsByEventIds(
        usuarioId,
        eventIds,
      );
    }

    if (revisoesParaRessincronizar.length) {
      await Promise.all(
        revisoesParaRessincronizar.map((id) =>
          this.googleCalendar.syncRevisionById(usuarioId, id),
        ),
      );
    }

    // Recalcula ofensiva pois remoção pode desfazer dias ativos.
    void this.ofensivaService.recalcularEAtualizar(usuarioId);

    return removido;
  }

  async criarComTx(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    dto: CreateRegistroDto,
  ) {
    const dataEstudo = dto.dataEstudo
      ? parseISODate(dto.dataEstudo)
      : new Date();
    if (!dataEstudo) throw new BadRequestException('Data de estudo inválida');

    const tema = await this.buscarTema(tx, usuarioId, dto.temaId);
    const slot = await this.buscarSlot(tx, usuarioId, dto.slotId);
    const revisao = await this.buscarRevisao(
      tx,
      usuarioId,
      dto.revisaoProgramadaId,
    );

    const temaIdFinal = this.validarRegrasDeNegocio(
      dto.tipoRegistro,
      tema?.id,
      slot?.temaId,
      revisao,
    );

    const registro = await tx.registroEstudo.create({
      data: {
        tempoDedicado: dto.tempoDedicado,
        conteudoEstudado: dto.conteudoEstudado?.trim() ?? null,
        tipoRegistro: dto.tipoRegistro,
        dataEstudo,
        temaId: temaIdFinal ?? null,
        slotId: slot?.id ?? null,
        creatorId: usuarioId,
      },
      include: {
        tema: true,
        slotCronograma: {
          include: { tema: true },
        },
      },
    });

    if (dto.tipoRegistro === TipoRegistro.EstudoDeTema) {
      const revisoesIds = await this.criarRevisoes(
        tx,
        usuarioId,
        registro.id,
        registro.slotId,
        dataEstudo,
      );

      return { registro, revisoesCriadasIds: revisoesIds };
    }

    if (dto.tipoRegistro === TipoRegistro.Revisao && revisao) {
      await tx.revisaoProgramada.update({
        where: { id: revisao.id },
        data: {
          statusRevisao: StatusRevisao.Concluida,
          registroConclusaoId: registro.id,
        },
      });
    }

    return { registro, revisoesCriadasIds: [] as number[] };
  }

  private validarRegrasDeNegocio(
    tipo: TipoRegistro,
    temaId: number | undefined,
    temaDoSlot: number | undefined,
    revisao: {
      id: number;
      statusRevisao: StatusRevisao;
      registroOrigem: { temaId: number | null };
    } | null,
  ) {
    switch (tipo) {
      case TipoRegistro.EstudoDeTema: {
        if (!temaId)
          throw new BadRequestException(
            'Registros do tipo EstudoDeTema precisam de um tema',
          );
        if (!temaDoSlot)
          throw new BadRequestException(
            'Registros do tipo EstudoDeTema precisam estar vinculados a um slot do cronograma',
          );
        if (temaDoSlot !== temaId) {
          throw new BadRequestException(
            'Tema selecionado precisa coincidir com o tema do slot informado',
          );
        }
        return temaId;
      }
      case TipoRegistro.Revisao: {
        if (!revisao)
          throw new BadRequestException(
            'Registros do tipo Revisao requerem uma revisão programada associada',
          );
        if (revisao.statusRevisao === StatusRevisao.Concluida) {
          throw new BadRequestException(
            'Essa revisão já foi concluída anteriormente',
          );
        }
        if (revisao.registroOrigem.temaId == null) {
          throw new BadRequestException(
            'Revisões precisam estar associadas a um tema válido',
          );
        }
        return revisao.registroOrigem.temaId;
      }
      case TipoRegistro.EstudoAberto: {
        if (revisao)
          throw new BadRequestException(
            'Registros EstudoAberto não podem atualizar revisões programadas',
          );
        return temaId ?? null;
      }
      default:
        throw new BadRequestException('Tipo de registro inválido');
    }
  }

  private async buscarTema(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    temaId?: number,
  ) {
    if (!temaId) return null;
    const tema = await tx.temaDeEstudo.findFirst({
      where: { id: temaId, creatorId: usuarioId },
    });
    if (!tema) throw new NotFoundException('Tema de estudo não encontrado');
    return tema;
  }

  private async buscarSlot(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    slotId?: number,
  ) {
    if (!slotId) return null;
    const slot = await tx.slotCronograma.findFirst({
      where: { id: slotId, creatorId: usuarioId },
      include: { tema: true },
    });
    if (!slot)
      throw new NotFoundException(
        'Slot do cronograma não encontrado para o usuário',
      );
    return slot;
  }

  private async buscarRevisao(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    revisaoId?: number,
  ) {
    if (!revisaoId) return null;
    const revisao = await tx.revisaoProgramada.findFirst({
      where: { id: revisaoId, creatorId: usuarioId },
      include: {
        registroOrigem: {
          select: { temaId: true },
        },
      },
    });
    if (!revisao)
      throw new NotFoundException(
        'Revisão programada não encontrada para o usuário autenticado',
      );
    return revisao;
  }

  private async criarRevisoes(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    registroId: number,
    slotId: number | null,
    dataEstudo: Date,
  ) {
    const preferencias = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { planejamentoRevisoes: true },
    });

    const espacamentos = (preferencias?.planejamentoRevisoes ?? [1, 7, 14])
      .filter((dias) => dias > 0)
      .sort((a, b) => a - b);

    const dataBase = startOfDay(dataEstudo);

    const created = await Promise.all(
      espacamentos.map((dias) =>
        tx.revisaoProgramada.create({
          data: {
            dataRevisao: addDays(dataBase, dias),
            registroOrigemId: registroId,
            creatorId: usuarioId,
            slotCronogramaId: slotId,
          },
          select: { id: true },
        }),
      ),
    );

    return created.map((r) => r.id);
  }
}
