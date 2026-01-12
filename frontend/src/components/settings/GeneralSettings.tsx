import { Settings as SettingsIcon } from "lucide-react";

interface GeneralSettingsProps {
  dailyGoal: number;
  onChange: (value: number) => void;
}

export function GeneralSettings({ dailyGoal, onChange }: GeneralSettingsProps) {
  const hours = Math.floor(dailyGoal / 60);
  const minutes = dailyGoal % 60;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <SettingsIcon className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Meta Diária</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Meta de estudo diário (minutos)
          </label>
          <input
            type="number"
            min="15"
            max="480"
            step="15"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-slate-700"
            value={dailyGoal}
            onChange={(e) => onChange(parseInt(e.target.value) || 60)}
          />
        </div>

        <p className="text-sm text-slate-500 flex items-center gap-2">
          Meta atual:
          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {hours}h {minutes > 0 ? `${minutes}min` : ""} por dia
          </span>
        </p>
      </div>
    </div>
  );
}
