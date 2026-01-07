import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpsertCronogramaDto } from './dto/upsert-cronograma.dto';
import {
  addDays,
  endOfWeek,
  formatISODate,
  getOffsetFromFirstDay,
  parseISODate,
  startOfDay,
  startOfWeek,
} from '@/common/utils/date.utils';
import { TipoRegistro } from '@prisma/client';

const SLOT_STATUS = {
  CONCLUIDO: 'concluido',
  PENDENTE: 'pendente',
  ATRASADO: 'atrasado',
} as const;

type SlotStatus = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS];

@Injectable()
export class CronogramasService {
  constructor(private readonly prisma: PrismaService) {}

  async obterCronogramaComStatus(usuarioId: number, referenciaIso?: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        primeiroDiaSemana: true,
      },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const cronograma = await this.ensureCronograma(usuarioId);
    const slots = await this.prisma.slotCronograma.findMany({
      where: { cronogramaId: cronograma.id, creatorId: usuarioId },
      include: { tema: true },
      orderBy: [{ diaSemana: 'asc' }, { ordem: 'asc' }, { id: 'asc' }],
    });

    const referenciaDate = parseISODate(referenciaIso) ?? new Date();
    const inicioSemana = startOfWeek(referenciaDate, usuario.primeiroDiaSemana);
    const fimSemana = endOfWeek(inicioSemana);

    const slotIds = slots.map((slot) => slot.id);
    const registrosSemanais = slotIds.length
      ? await this.prisma.registroEstudo.findMany({
          where: {
            creatorId: usuarioId,
            slotId: { in: slotIds },
            tipoRegistro: TipoRegistro.EstudoDeTema,
            dataEstudo: { gte: inicioSemana, lt: fimSemana },
          },
          select: { slotId: true, dataEstudo: true },
        })
      : [];

    const registrosPorChave = new Set<string>();
    registrosSemanais.forEach((registro) => {
      const chave = `${registro.slotId}:${formatISODate(registro.dataEstudo)}`;
      registrosPorChave.add(chave);
    });

    const hoje = startOfDay(new Date());

    const slotsFormatados = slots.map((slot) => {
      const offset = getOffsetFromFirstDay(
        usuario.primeiroDiaSemana,
        slot.diaSemana,
      );
      const dataAlvo = addDays(inicioSemana, offset);
      const chave = `${slot.id}:${formatISODate(dataAlvo)}`;
      let status: SlotStatus = SLOT_STATUS.PENDENTE;
      if (registrosPorChave.has(chave)) status = SLOT_STATUS.CONCLUIDO;
      else if (dataAlvo < hoje) status = SLOT_STATUS.ATRASADO;

      return {
        id: slot.id,
        diaSemana: slot.diaSemana,
        ordem: slot.ordem,
        tema: slot.tema,
        dataAlvo: dataAlvo.toISOString(),
        status,
      };
    });

    return {
      semana: {
        referencia: referenciaDate.toISOString(),
        inicio: inicioSemana.toISOString(),
        fim: addDays(fimSemana, -1).toISOString(),
      },
      cronograma: {
        id: cronograma.id,
        slots: slotsFormatados,
      },
    };
  }

  async upsert(usuarioId: number, dto: UpsertCronogramaDto) {
    const cronograma = await this.ensureCronograma(usuarioId);

    const temaIds = Array.from(new Set(dto.slots.map((slot) => slot.temaId)));
    if (temaIds.length) {
      const temas = await this.prisma.temaDeEstudo.findMany({
        where: { creatorId: usuarioId, id: { in: temaIds } },
        select: { id: true },
      });
      if (temas.length !== temaIds.length) {
        throw new BadRequestException(
          'Um ou mais temas não pertencem ao usuário autenticado',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const existentes = await tx.slotCronograma.findMany({
        where: { cronogramaId: cronograma.id, creatorId: usuarioId },
        select: { id: true },
      });
      const existentesMap = new Map(existentes.map((slot) => [slot.id, slot]));
      const idsQuePermanecem = new Set<number>();

      for (const slotDto of dto.slots) {
        if (slotDto.id) {
          if (!existentesMap.has(slotDto.id)) {
            throw new NotFoundException(
              `Slot ${slotDto.id} não encontrado para o usuário`,
            );
          }
          idsQuePermanecem.add(slotDto.id);
          await tx.slotCronograma.update({
            where: { id: slotDto.id },
            data: {
              diaSemana: slotDto.diaSemana,
              ordem: slotDto.ordem,
              temaId: slotDto.temaId,
            },
          });
        } else {
          const novo = await tx.slotCronograma.create({
            data: {
              diaSemana: slotDto.diaSemana,
              ordem: slotDto.ordem,
              temaId: slotDto.temaId,
              cronogramaId: cronograma.id,
              creatorId: usuarioId,
            },
          });
          idsQuePermanecem.add(novo.id);
        }
      }

      const idsParaRemover = existentes
        .map((s) => s.id)
        .filter((id) => !idsQuePermanecem.has(id));
      if (idsParaRemover.length) {
        await tx.slotCronograma.deleteMany({
          where: { id: { in: idsParaRemover } },
        });
      }
    });

    return await this.obterCronogramaComStatus(usuarioId);
  }

  private async ensureCronograma(usuarioId: number) {
    const existente = await this.prisma.cronogramaSemanal.findUnique({
      where: { creatorId: usuarioId },
    });
    if (existente) return existente;
    return await this.prisma.cronogramaSemanal.create({
      data: { creatorId: usuarioId },
    });
  }
}
