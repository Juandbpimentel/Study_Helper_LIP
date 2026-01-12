import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
      </div>
    </div>
  );
}
