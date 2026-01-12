import {
  buildDiasAtivosWindow,
  calcularOfensivaPorDiasAtivos,
} from './streak.utils';

function iso(date: string): Date {
  return new Date(date);
}

describe('streak.utils', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('calcularOfensivaPorDiasAtivos: sem dias => ofensiva zerada', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([]);

    expect(result).toEqual({
      atual: 0,
      bloqueiosTotais: 2,
      bloqueiosUsados: 0,
      bloqueiosRestantes: 2,
      ultimoDiaAtivo: null,
    });
  });

  it('calcularOfensivaPorDiasAtivos: de-duplica dias (mesmo dia em horários diferentes)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([
      iso('2026-01-08T10:00:00.000Z'),
      iso('2026-01-08T05:00:00.000Z'),
    ]);

    expect(result.atual).toBe(1);
    expect(result.ultimoDiaAtivo).toBe(
      new Date(2026, 0, 8, 0, 0, 0).toISOString(),
    );
  });

  it('calcularOfensivaPorDiasAtivos: dias consecutivos mantêm sequência sem consumir bloqueios', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([
      iso('2026-01-08T10:00:00.000Z'),
      iso('2026-01-07T10:00:00.000Z'),
      iso('2026-01-06T10:00:00.000Z'),
    ]);

    expect(result).toEqual({
      atual: 3,
      bloqueiosTotais: 2,
      bloqueiosUsados: 0,
      bloqueiosRestantes: 2,
      ultimoDiaAtivo: new Date(2026, 0, 8, 0, 0, 0).toISOString(),
    });
  });

  it('calcularOfensivaPorDiasAtivos: gap entre dias consome bloqueios (faltasEntre)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([
      iso('2026-01-08T10:00:00.000Z'),
      iso('2026-01-06T10:00:00.000Z'),
    ]);

    expect(result.atual).toBe(2);
    expect(result.bloqueiosUsados).toBe(1);
    expect(result.bloqueiosRestantes).toBe(1);
  });

  it('calcularOfensivaPorDiasAtivos: gap grande demais não estende sequência', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([
      iso('2026-01-08T10:00:00.000Z'),
      iso('2026-01-04T10:00:00.000Z'),
    ]);

    expect(result.atual).toBe(1);
    expect(result.bloqueiosUsados).toBe(0);
    expect(result.bloqueiosRestantes).toBe(2);
  });

  it('calcularOfensivaPorDiasAtivos: consome bloqueio apenas após dia inteiro sem atividade (entre ultimo e hoje)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([
      iso('2026-01-06T10:00:00.000Z'),
    ]);

    expect(result.atual).toBe(1);
    expect(result.bloqueiosUsados).toBe(1); // dia 07 inteiro sem atividade
    expect(result.bloqueiosRestantes).toBe(1);
  });

  it('calcularOfensivaPorDiasAtivos: quando estoura bloqueios pelo tempo, zera ofensiva', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));

    const result = calcularOfensivaPorDiasAtivos([
      iso('2026-01-06T10:00:00.000Z'),
    ]);

    expect(result.atual).toBe(0);
    expect(result.bloqueiosUsados).toBe(2);
    expect(result.bloqueiosRestantes).toBe(0);
  });

  it('buildDiasAtivosWindow: filtra datas por janela (daysBack)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

    const result = buildDiasAtivosWindow(
      [
        new Date(2026, 0, 1, 0, 0, 0),
        new Date(2026, 0, 5, 0, 0, 0),
        new Date(2026, 0, 8, 0, 0, 0),
      ],
      3,
    );

    expect(result.map((d) => d.toISOString())).toEqual([
      new Date(2026, 0, 5, 0, 0, 0).toISOString(),
      new Date(2026, 0, 8, 0, 0, 0).toISOString(),
    ]);
  });
});
