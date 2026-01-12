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
  value.setHours(0, 0, 0, 0);
  return value;
}

export function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function startOfWeek(date: Date, primeiroDia: DiaSemana): Date {
  const target = startOfDay(date);
  const current = target.getDay();
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

  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnlyMatch) {
    const [y, m, d] = value.split('-').map((v) => Number(v));
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function formatISODate(date: Date): string {
  return startOfDay(date).toISOString();
}
