import { AlertTriangle, Clock, CheckCircle2, LucideIcon } from "lucide-react";

interface StatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
}

function StatItem({ label, value, icon: Icon, colorClass }: StatProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function ReviewStats({
  overdue,
  pending,
  completed,
}: {
  overdue: number;
  pending: number;
  completed: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <StatItem
        label="Atrasadas"
        value={overdue}
        icon={AlertTriangle}
        colorClass="text-red-500"
      />
      <StatItem
        label="Para Hoje"
        value={pending}
        icon={Clock}
        colorClass="text-amber-500"
      />
      <StatItem
        label="Concluídas"
        value={completed}
        icon={CheckCircle2}
        colorClass="text-emerald-500"
      />
    </div>
  );
}
