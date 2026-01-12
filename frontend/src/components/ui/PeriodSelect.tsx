import React from "react";
import { ChevronDown } from "lucide-react";

interface PeriodSelectProps {
  value: string; // 'all' | '7' | '14' | '30' | '60' | '90' | 'custom'
  startDate?: string; // yyyy-mm-dd
  endDate?: string; // yyyy-mm-dd
  onChange: (v: string) => void;
  onChangeRange?: (start?: string, end?: string) => void;
  className?: string;
  /** If true, the custom date inputs are not rendered inside this component. Use when you want to render them externally. */
  hideCustomInputs?: boolean;
}

export function PeriodSelect({
  value,
  startDate,
  endDate,
  onChange,
  onChangeRange,
  className = "",
  hideCustomInputs = false,
}: PeriodSelectProps) {
  return (
    <div className={`flex flex-col gap-2 items-end ${className}`}>
      <div className="relative w-40 min-w-[160px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm cursor-pointer w-full"
        >
          <option value="all">Todo o histórico</option>
          <option value="7">Últimos 7 dias</option>
          <option value="14">Últimos 14 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="custom">Período personalizado</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {value === "custom" && !hideCustomInputs && (
        // sempre renderiza em linha separada abaixo do select, mas com inputs de tamanho fixo
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => onChangeRange?.(e.target.value, endDate)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-36"
          />
          <span className="text-sm text-slate-500">até</span>
          <input
            type="date"
            value={endDate ?? ""}
            onChange={(e) => onChangeRange?.(startDate, e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-36"
          />
        </div>
      )}
    </div>
  );
}
