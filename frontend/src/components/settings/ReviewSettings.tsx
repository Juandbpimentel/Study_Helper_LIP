import { Clock } from "lucide-react";

interface ReviewIntervals {
  d1: number;
  d2: number;
  d3: number;
}

interface ReviewSettingsProps {
  intervals: ReviewIntervals;
  onChange: (newIntervals: ReviewIntervals) => void;
}

export function ReviewSettings({ intervals, onChange }: ReviewSettingsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Clock className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Intervalos de Revisão
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Configure os dias para cada revisão após estudar um conteúdo novo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              1ª Revisão (dias)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-700"
              value={intervals.d1}
              onChange={(e) =>
                onChange({ ...intervals, d1: parseInt(e.target.value) || 1 })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              2ª Revisão (dias)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-700"
              value={intervals.d2}
              onChange={(e) =>
                onChange({ ...intervals, d2: parseInt(e.target.value) || 7 })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              3ª Revisão (dias)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-700"
              value={intervals.d3}
              onChange={(e) =>
                onChange({ ...intervals, d3: parseInt(e.target.value) || 14 })
              }
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Padrão recomendado: D+1, D+7, D+14 (baseado na curva de esquecimento)
        </p>
      </div>
    </div>
  );
}
