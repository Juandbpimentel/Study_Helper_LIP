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
  it('startOfDay: zera horário no horário local', () => {
    const input = new Date('2026-01-08T15:23:45.678Z');
    const result = startOfDay(input);

    const expected = new Date(
      input.getFullYear(),
      input.getMonth(),
      input.getDate(),
      0,
      0,
      0,
      0,
    );
    expect(result.getTime()).toBe(expected.getTime());
    expect(input.toISOString()).toBe('2026-01-08T15:23:45.678Z');
  });

  it('addDays: soma dias no calendário local', () => {
    const input = new Date(2026, 0, 31, 0, 0, 0);
    const result = addDays(input, 1);
    const expected = new Date(2026, 1, 1, 0, 0, 0);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('startOfWeek: retorna o início da semana baseado no primeiroDia (local)', () => {
    const date = new Date(2026, 0, 8, 15, 0, 0);

    const monday = startOfWeek(date, DiaSemana.Seg);
    const expectedMon = new Date(2026, 0, 5, 0, 0, 0);
    expect(monday.getTime()).toBe(expectedMon.getTime());

    const sunday = startOfWeek(date, DiaSemana.Dom);
    const expectedSun = new Date(2026, 0, 4, 0, 0, 0);
    expect(sunday.getTime()).toBe(expectedSun.getTime());
  });

  it('endOfWeek: adiciona 7 dias ao start', () => {
    const start = new Date(2026, 0, 5, 0, 0, 0);
    const expected = new Date(2026, 0, 12, 0, 0, 0);
    expect(endOfWeek(start).getTime()).toBe(expected.getTime());
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
    const expected = startOfDay(date).toISOString();
    expect(formatISODate(date)).toBe(expected);
  });
});
