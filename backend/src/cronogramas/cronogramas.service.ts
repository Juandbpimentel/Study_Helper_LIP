import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GoogleCalendarService } from '@/integrations/google/google-calendar.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

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

    // Buscamos registros numa janela ampliada para conseguir avaliar a conclusão do slot
    // mesmo quando a próxima ocorrência cai na semana seguinte.
    const janelaInicio = addDays(inicioSemana, -7);
    const janelaFim = addDays(fimSemana, 7);
    const registros = slotIds.length
      ? await this.prisma.registroEstudo.findMany({
          where: {
            creatorId: usuarioId,
            slotId: { in: slotIds },
            tipoRegistro: TipoRegistro.EstudoDeTema,
            dataEstudo: { gte: janelaInicio, lt: janelaFim },
          },
          select: { slotId: true, dataEstudo: true },
        })
      : [];

    const registrosPorSlot = new Map<number, Date[]>();
    for (const registro of registros) {
      if (registro.slotId == null) continue;
      const list = registrosPorSlot.get(registro.slotId) ?? [];
      list.push(registro.dataEstudo);
      registrosPorSlot.set(registro.slotId, list);
    }

    // Importante: usamos a referência como "hoje" para permitir consultar semanas passadas/futuras
    // sem depender do relógio atual do servidor.
    const hoje = startOfDay(referenciaDate);

    const slotsFormatados = slots.map((slot) => {
      const offset = getOffsetFromFirstDay(
        usuario.primeiroDiaSemana,
        slot.diaSemana,
      );

      // Data prevista para este slot dentro da semana consultada.
      const dataPrevista = addDays(inicioSemana, offset);

      // A dataAlvo exposta é sempre a PRÓXIMA ocorrência (se a prevista já passou, joga +7).
      let proximaDataAlvo = dataPrevista;
      if (dataPrevista < hoje) proximaDataAlvo = addDays(dataPrevista, 7);

      // Considera o slot concluído se houver qualquer registro do slot dentro do ciclo semanal
      // [dataPrevista, proximaDataAlvo). Isso permite concluir atrasado (ex.: quinta para slot de segunda).
      const registrosDoSlot = registrosPorSlot.get(slot.id) ?? [];
      const concluidoNoCiclo = registrosDoSlot.some(
        (d) => d >= dataPrevista && d < proximaDataAlvo,
      );

      let status: SlotStatus = SLOT_STATUS.PENDENTE;
      if (concluidoNoCiclo) status = SLOT_STATUS.CONCLUIDO;
      else if (dataPrevista < hoje) status = SLOT_STATUS.ATRASADO;

      return {
        id: slot.id,
        diaSemana: slot.diaSemana,
        ordem: slot.ordem,
        tema: slot.tema,
        dataAlvo: proximaDataAlvo.toISOString(),
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

    let eventIdsParaRemover: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      const existentes = await tx.slotCronograma.findMany({
        where: { cronogramaId: cronograma.id, creatorId: usuarioId },
        select: { id: true, googleEventId: true },
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

      eventIdsParaRemover = existentes
        .filter((s) => idsParaRemover.includes(s.id))
        .map((s) => s.googleEventId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      if (idsParaRemover.length) {
        await tx.slotCronograma.deleteMany({
          where: { id: { in: idsParaRemover } },
        });
      }
    });

    // Fora da transação: chamadas externas para deletar eventos removidos.
    if (eventIdsParaRemover.length) {
      await this.googleCalendar.deleteSlotEventsByEventIds(
        usuarioId,
        eventIdsParaRemover,
      );
    }

    // Sync incremental (upsert/ajustes) para slots existentes.
    await this.googleCalendar.syncSlotsForUser(usuarioId);

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
