import {
  format,
  parseISO,
  isBefore,
  startOfDay,
  formatDistanceToNow,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Revisao } from "@/types/types";

interface ReviewCardProps {
  review: Revisao;
  onComplete: (id: number) => void;
  showFutureDate?: boolean;
}

export function ReviewCard({
  review,
  onComplete,
  showFutureDate,
}: ReviewCardProps) {
  const today = startOfDay(new Date());
  const reviewDate = parseISO(review.data_revisao);
  const isDone = review.status_revisao === "CONCLUIDA";

  const isLate = isBefore(reviewDate, today) && !isDone;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-100 transition-colors">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl shrink-0 ${
            isDone
              ? "bg-emerald-50 text-emerald-600"
              : isLate
              ? "bg-red-50 text-red-500"
              : "bg-indigo-50 text-indigo-600"
          }`}
        >
          <BookOpen className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">
            {review.registro_origem?.conteudo_estudado || "Revisão Geral"}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 font-medium">
              {review.tema?.tema || "Geral"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {(() => {
                const origin = review.registro_origem?.data_estudo;
                if (!origin) return "Revisão";
                try {
                  const createDate = parseISO(origin);
                  const revDate = parseISO(review.data_revisao);
                  const diff = Math.round(
                    (revDate.getTime() - createDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const defaultIntervals = [1, 7, 14];
                  const idx = defaultIntervals.indexOf(diff);
                  if (idx >= 0) return `${idx + 1}ª Revisão`;
                  return "Revisão";
                } catch (e) {
                  return "Revisão";
                }
              })()}
            </span>
          </div>

          {isLate && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-md w-fit">
              <AlertTriangle className="w-3.5 h-3.5" />
              Atrasada há {formatDistanceToNow(reviewDate, { locale: ptBR })}
            </div>
          )}

          {showFutureDate && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-fit">
              <CalendarDays className="w-3.5 h-3.5" />
              {format(reviewDate, "dd 'de' MMM", { locale: ptBR })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pl-14 sm:pl-0">
        {!isDone ? (
          <button
            type="button"
            onClick={() => onComplete(review.id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-transform transform cursor-pointer active:scale-95 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            Concluir
          </button>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            Concluída
          </div>
        )}
      </div>
    </div>
  );
}
