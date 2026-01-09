import { DiaSemana } from '@prisma/client';
import {
  addDays,
  endOfWeek,
  formatISODate,
  getOffsetFromFirstDay,
  parseISODate,
  startOfDay,
  startOfWeek,
} from './date.utils';

describe('date.utils', () => {
  it('startOfDay: zera horário em UTC', () => {
    const input = new Date('2026-01-08T15:23:45.678Z');
    const result = startOfDay(input);

    expect(result.toISOString()).toBe('2026-01-08T00:00:00.000Z');
    // não muta a instância original
    expect(input.toISOString()).toBe('2026-01-08T15:23:45.678Z');
  });

  it('addDays: soma dias em UTC', () => {
    const input = new Date('2026-01-31T00:00:00.000Z');
    const result = addDays(input, 1);
    expect(result.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('startOfWeek: retorna o início da semana baseado no primeiroDia', () => {
    const date = new Date('2026-01-08T15:00:00.000Z'); // Qui

    const monday = startOfWeek(date, DiaSemana.Seg);
    expect(monday.toISOString()).toBe('2026-01-05T00:00:00.000Z');

    const sunday = startOfWeek(date, DiaSemana.Dom);
    expect(sunday.toISOString()).toBe('2026-01-04T00:00:00.000Z');
  });

  it('endOfWeek: adiciona 7 dias ao start', () => {
    const start = new Date('2026-01-05T00:00:00.000Z');
    expect(endOfWeek(start).toISOString()).toBe('2026-01-12T00:00:00.000Z');
  });

  it('getOffsetFromFirstDay: calcula offset circular', () => {
    expect(getOffsetFromFirstDay(DiaSemana.Seg, DiaSemana.Seg)).toBe(0);
    expect(getOffsetFromFirstDay(DiaSemana.Seg, DiaSemana.Qua)).toBe(2);
    expect(getOffsetFromFirstDay(DiaSemana.Sex, DiaSemana.Seg)).toBe(3);
  });

  it('parseISODate: retorna undefined para vazio/invalid e Date para ISO válido', () => {
    expect(parseISODate(undefined)).toBeUndefined();
    expect(parseISODate(null)).toBeUndefined();
    expect(parseISODate('')).toBeUndefined();
    expect(parseISODate('not-a-date')).toBeUndefined();

    const parsed = parseISODate('2026-01-08T00:00:00.000Z');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });

  it('formatISODate: formata usando startOfDay', () => {
    const date = new Date('2026-01-08T15:00:00.000Z');
    expect(formatISODate(date)).toBe('2026-01-08T00:00:00.000Z');
  });
});
