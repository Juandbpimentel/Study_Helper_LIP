import { ChevronDown } from "lucide-react";

interface StatisticsFiltersProps {
  period: string;
  onChange: (value: string) => void;
}

export function StatisticsFilters({
  period,
  onChange,
}: StatisticsFiltersProps) {
  return (
    <div className="relative">
      <select
        value={period}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm cursor-pointer min-w-[160px]"
      >
        <option value="7">Últimos 7 dias</option>
        <option value="14">Últimos 14 dias</option>
        <option value="30">Últimos 30 dias</option>
        <option value="90">Últimos 90 dias</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}
