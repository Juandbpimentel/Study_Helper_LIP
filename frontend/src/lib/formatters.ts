import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function capitalizeMonthInPortuguese(dateStr: string) {
  // Encontrar o mês entre os dois " de " que normalmente aparecem em "dd 'de' MMMM 'de' yyyy"
  // Ex: "11 de janeiro de 2026, às 12:00" -> capitalizar "janeiro"
  return dateStr.replace(/(\d{1,2} de )(.+?)( de \d{4})/i, (_m, p1, p2, p3) => {
    if (!p2) return _m;
    const cap = p2.charAt(0).toUpperCase() + p2.slice(1);
    return `${p1}${cap}${p3}`;
  });
}

export function formatDatePt(input: string | Date | null | undefined): string {
  if (!input) return "--";
  const d = typeof input === "string" ? parseISO(input) : input;
  const raw = format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  return capitalizeMonthInPortuguese(raw);
}

export function formatDateTimePt(
  input: string | Date | null | undefined
): string {
  if (!input) return "--";
  const d = typeof input === "string" ? parseISO(input) : input;
  const raw = format(d, "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR });
  return capitalizeMonthInPortuguese(raw);
}
