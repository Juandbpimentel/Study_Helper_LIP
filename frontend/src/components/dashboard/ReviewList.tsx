import { AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { Revisao, dashboardService } from "@/services/dashboard-service";

// Props agora aceita a lista original de Revisões e uma função opcional de refresh
interface ReviewListProps {
  reviews: Revisao[];
  onRefresh?: () => void;
}

export function ReviewList({ reviews, onRefresh }: ReviewListProps) {
  const today = startOfDay(new Date());

  const handleComplete = async (id: number) => {
    try {
      await dashboardService.completeReview(id);
      if (onRefresh) onRefresh(); // Recarrega o dashboard
    } catch (error) {
      console.error("Erro ao concluir revisão", error);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-slate-800">
          Revisões para Hoje ({reviews.length})
        </h2>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          // --- LÓGICA DE DADOS DENTRO DO COMPONENTE ---
          const reviewDate = parseISO(review.data_revisao);

          // Verifica se está atrasada (data < hoje)
          const isLate = isBefore(reviewDate, today);

          // Formata a data (Ex: 09/01)
          const dateLabel = format(reviewDate, "dd/MM");

          // Pega os dados das relações (com fallback para evitar crash)
          const topic =
            review.registro_origem?.conteudo_estudado || "Sem tópico";
          const subject = review.tema?.tema || "Geral";

          return (
            <div
              key={review.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-100 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-red-50 text-red-500 mt-1">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {topic}
                  </h3>
                  <p className="text-sm text-slate-500 mb-2">{subject}</p>

                  {isLate && (
                    <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                      <AlertCircle className="w-3 h-3" />
                      Atrasada desde {dateLabel}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:gap-1 pl-12 sm:pl-0">
                <span className="text-xs font-medium px-2 py-1 rounded bg-orange-100 text-orange-700 mb-2">
                  {dateLabel}
                </span>
                <button
                  onClick={() => handleComplete(review.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
