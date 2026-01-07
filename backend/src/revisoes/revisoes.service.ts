import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RegistrosService } from '@/registros/registros.service';
import { ConcluirRevisaoDto } from './dto/concluir-revisao.dto';
import { AdiarRevisaoDto } from './dto/adiar-revisao.dto';
import { ListarRevisoesQueryDto } from './dto/listar-revisoes.dto';
import { Prisma, StatusRevisao, TipoRegistro } from '@prisma/client';
import { addDays, parseISODate, startOfDay } from '@/common/utils/date.utils';

@Injectable()
export class RevisoesService {
  constructor(
    private readonly prisma: PrismaService,
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

    return await this.prisma.revisaoProgramada.findMany({
      where,
      orderBy: { dataRevisao: 'asc' },
      include: {
        registroOrigem: {
          include: {
            tema: true,
            slotCronograma: {
              include: { tema: true },
            },
          },
        },
        registroConclusao: true,
      },
    });
  }

  async concluir(
    usuarioId: number,
    revisaoId: number,
    dto: ConcluirRevisaoDto,
  ) {
    const revisao = await this.prisma.revisaoProgramada.findFirst({
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

    await this.registrosService.criar(usuarioId, {
      tipoRegistro: TipoRegistro.Revisao,
      tempoDedicado: dto.tempoDedicado,
      conteudoEstudado: dto.conteudoEstudado,
      dataEstudo: dto.dataEstudo,
      revisaoProgramadaId: revisao.id,
      temaId: revisao.registroOrigem.temaId ?? undefined,
      slotId: revisao.registroOrigem.slotId ?? undefined,
    });

    await this.atualizarStatusAutomatico(usuarioId);

    return await this.prisma.revisaoProgramada.findUnique({
      where: { id: revisao.id },
      include: {
        registroOrigem: true,
        registroConclusao: true,
      },
    });
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
    await this.prisma.revisaoProgramada.update({
      where: { id: revisaoId },
      data: {
        dataRevisao: dataNormalizada,
        statusRevisao: StatusRevisao.Adiada,
      },
    });

    await this.atualizarStatusAutomatico(usuarioId);

    return await this.prisma.revisaoProgramada.findUnique({
      where: { id: revisaoId },
    });
  }

  private async atualizarStatusAutomatico(usuarioId: number) {
    const hoje = startOfDay(new Date());

    await this.prisma.revisaoProgramada.updateMany({
      where: {
        creatorId: usuarioId,
        statusRevisao: { in: [StatusRevisao.Pendente, StatusRevisao.Adiada] },
        dataRevisao: { lt: hoje },
      },
      data: { statusRevisao: StatusRevisao.Atrasada },
    });

    await this.prisma.revisaoProgramada.updateMany({
      where: {
        creatorId: usuarioId,
        statusRevisao: StatusRevisao.Atrasada,
        dataRevisao: { gte: hoje },
      },
      data: { statusRevisao: StatusRevisao.Pendente },
    });
  }
}
