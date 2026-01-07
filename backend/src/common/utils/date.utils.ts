import { DiaSemana } from '@prisma/client';

const DIA_SEMANA_MAP: Record<DiaSemana, number> = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  Sab: 6,
};

export function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

export function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

export function startOfWeek(date: Date, primeiroDia: DiaSemana): Date {
  const target = startOfDay(date);
  const current = target.getUTCDay();
  const desired = DIA_SEMANA_MAP[primeiroDia];
  const diff = (current - desired + 7) % 7;
  return addDays(target, -diff);
}

export function endOfWeek(start: Date): Date {
  return addDays(start, 7);
}

export function getOffsetFromFirstDay(
  primeiroDia: DiaSemana,
  diaSlot: DiaSemana,
): number {
  const firstIndex = DIA_SEMANA_MAP[primeiroDia];
  const slotIndex = DIA_SEMANA_MAP[diaSlot];
  return (slotIndex - firstIndex + 7) % 7;
}

export function parseISODate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function formatISODate(date: Date): string {
  return startOfDay(date).toISOString();
}
