import { addDays, formatISODate, startOfDay } from './date.utils';

export type OfensivaResumo = {
  atual: number;
  bloqueiosTotais: number;
  bloqueiosUsados: number;
  bloqueiosRestantes: number;
  ultimoDiaAtivo: string | null;
};

function diffEmDias(a: Date, b: Date): number {
  const aa = startOfDay(a).getTime();
  const bb = startOfDay(b).getTime();
  return Math.floor((aa - bb) / (24 * 60 * 60 * 1000));
}

export function calcularOfensivaPorDiasAtivos(
  diasAtivosDesc: Date[],
  bloqueiosTotais = 2,
): OfensivaResumo {
  const diasUnicos: Date[] = [];
  const seen = new Set<string>();

  for (const d of diasAtivosDesc) {
    const key = formatISODate(startOfDay(d));
    if (seen.has(key)) continue;
    seen.add(key);
    diasUnicos.push(startOfDay(d));
  }

  if (!diasUnicos.length) {
    return {
      atual: 0,
      bloqueiosTotais,
      bloqueiosUsados: 0,
      bloqueiosRestantes: bloqueiosTotais,
      ultimoDiaAtivo: null,
    };
  }

  let atual = 1;
  let bloqueiosUsados = 0;
  let cursor = diasUnicos[0];

  for (let i = 1; i < diasUnicos.length; i++) {
    const proximo = diasUnicos[i];
    const diff = diffEmDias(cursor, proximo);
    if (diff <= 0) continue;

    const faltasEntre = diff - 1;
    if (faltasEntre < 0) continue;

    if (bloqueiosUsados + faltasEntre > bloqueiosTotais) break;
    if (diff > bloqueiosTotais + 1) break;

    bloqueiosUsados += faltasEntre;
    atual += 1;
    cursor = proximo;

    if (bloqueiosUsados === bloqueiosTotais) {
      // Ainda pode continuar se os próximos forem consecutivos (diff=1).
      continue;
    }
  }

  return {
    atual,
    bloqueiosTotais,
    bloqueiosUsados,
    bloqueiosRestantes: Math.max(0, bloqueiosTotais - bloqueiosUsados),
    ultimoDiaAtivo: formatISODate(diasUnicos[0]),
  };
}

export function buildDiasAtivosWindow(
  allDates: Date[],
  daysBack = 365,
): Date[] {
  const hoje = startOfDay(new Date());
  const inicio = addDays(hoje, -daysBack);
  return allDates.filter((d) => d >= inicio);
}
