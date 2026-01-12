import { Clock } from "lucide-react";

interface ReviewSettingsProps {
  intervals: number[];
  onChange: (newIntervals: number[]) => void;
}

export function ReviewSettings({ intervals, onChange }: ReviewSettingsProps) {
  const setAt = (idx: number, value: number) => {
    const next = intervals.slice();
    next[idx] = value;
    onChange(next.filter((n) => Number.isFinite(n) && n > 0));
  };

  const addInterval = () => {
    const nextDefault = intervals.length
      ? intervals[intervals.length - 1] + 1
      : 1;
    onChange([...intervals, nextDefault]);
  };

  const removeAt = (idx: number) => {
    const next = intervals.slice();
    next.splice(idx, 1);
    onChange(next);
  };

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
          Deixe em branco para não agendar revisões automaticamente.
        </p>

        <div className="space-y-3">
          {intervals.length === 0 && (
            <div className="text-sm text-slate-500">
              Nenhum intervalo definido.
            </div>
          )}

          {intervals.map((iv, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={iv}
                onChange={(e) => setAt(idx, parseInt(e.target.value) || 1)}
                className="w-28 px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-700"
              />
              <div className="text-sm text-slate-600 flex-1">dias após</div>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-transform transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                aria-label={`Remover intervalo ${iv} dias`}
              >
                Remover
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addInterval}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 active:scale-95"
          >
            + Adicionar intervalo
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Recomendações: D+1, D+7, D+14 são um bom ponto de partida.
        </p>
      </div>
    </div>
  );
}
