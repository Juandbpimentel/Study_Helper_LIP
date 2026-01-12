import { AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { Revisao } from "@/types/types";
import { reviewService } from "@/services/review-service";
import { studyService } from "@/services/study-service";
import { ToastBanner, ToastState } from "@/components/ui/ToastBanner";
import { useEffect, useState } from "react";
import { ConcludeReviewModal } from "@/components/reviews/ConcludeReviewModal";
import { RegisterStudyModal } from "@/components/dashboard/RegisterStudyModal";
import { offensivaService } from "@/services/offensiva-service";
import { OfensivaResumo } from "@/types/types";

const ofensivaMessages = {
  broken: [
    "Ofensiva quebrada. Tente novamente amanhã.",
    "Streak caiu. Bora retomar amanhã.",
    "Você perdeu a sequência. Recomece amanhã!",
  ],
  start: [
    "Parabéns! Você iniciou sua ofensiva.",
    "Primeiro dia de ofensiva! Mantenha o ritmo.",
    "Streak iniciada! Siga firme.",
  ],
  gain: [
    "Parabéns! +1 dia de ofensiva.",
    "Streak up! Mais um dia na conta.",
    "Sequência aumentou! Continue assim.",
  ],
  blockGain: [
    "Bloqueio recuperado na ofensiva!",
    "Você ganhou um bloqueio extra.",
    "Bloqueio devolvido. Proteção ativa!",
  ],
  blockUse: [
    "Você usou um bloqueio da ofensiva.",
    "Bloqueio consumido. Cuidado com a sequência!",
    "Um bloqueio foi usado. Foque no próximo dia.",
  ],
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

interface ReviewListProps {
  reviews: Revisao[];
  onRefresh?: () => void;
}

export function ReviewList({ reviews, onRefresh }: ReviewListProps) {
  const today = startOfDay(new Date());

  const [pendingReviewId, setPendingReviewId] = useState<number | null>(null);
  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [offensivaBase, setOffensivaBase] = useState<OfensivaResumo | null>(
    null
  );

  useEffect(() => {
    offensivaService
      .getMe()
      .then((res) => setOffensivaBase(res.data || null))
      .catch(() => null);
  }, []);

  const openConcludeModal = (id: number) => {
    setPendingReviewId(id);
    setIsConcludeModalOpen(true);
  };

  const handleOffensivaFeedback = (
    prev: OfensivaResumo | null,
    next: OfensivaResumo | null
  ) => {
    if (!next) return;

    if (prev && next.atual < prev.atual) {
      setToast({ variant: "error", message: pick(ofensivaMessages.broken) });
    } else if (prev && next.atual > prev.atual) {
      setToast({
        variant: "success",
        message: `${pick(ofensivaMessages.gain)} Série: ${next.atual}d.`,
      });
    } else if (!prev && next.atual > 0) {
      setToast({ variant: "success", message: pick(ofensivaMessages.start) });
    } else if (prev && next.bloqueiosRestantes > prev.bloqueiosRestantes) {
      setToast({
        variant: "success",
        message: pick(ofensivaMessages.blockGain),
      });
    } else if (prev && next.bloqueiosRestantes < prev.bloqueiosRestantes) {
      setToast({ variant: "info", message: pick(ofensivaMessages.blockUse) });
    }

    if (next) setOffensivaBase(next);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCompleteDirect = async () => {
    if (!pendingReviewId) return;
    try {
      // cria registro automático e marca revisão como concluída
      const payload: Parameters<typeof studyService.create>[0] = {
        tipo_registro: "Revisao",
        conteudo_estudado: "Concluído (registro automático)",
        data_estudo: new Date().toISOString(),
        tempo_dedicado: 0,
        revisao_programada_id: pendingReviewId,
      };
      await studyService.create(payload);

      await reviewService.complete(pendingReviewId);
      const ofensivaAfter = await offensivaService.getMe();
      if (onRefresh) onRefresh();
      setToast({
        variant: "success",
        message: "Revisão concluída e registro criado.",
      });
      handleOffensivaFeedback(offensivaBase, ofensivaAfter.data || null);
    } catch (error) {
      console.error("Erro ao concluir revisão com registro automático", error);
      setToast({ variant: "error", message: "Erro ao concluir revisão." });
    } finally {
      setIsConcludeModalOpen(false);
      setPendingReviewId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRegister = () => {
    setIsConcludeModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSuccess = () => {
    setIsRegisterModalOpen(false);
    setPendingReviewId(null);
    offensivaService.getMe().then((res) => {
      handleOffensivaFeedback(offensivaBase, res.data || null);
    });
    if (onRefresh) onRefresh();
  };

  return (
    <div>
      {toast && (
        <div className="mb-4">
          <ToastBanner toast={toast} onClose={() => setToast(null)} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-slate-800">
          Revisões para Hoje ({reviews.length})
        </h2>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const reviewDate = parseISO(review.data_revisao);
          const isLate = isBefore(reviewDate, today);
          const dateLabel = format(reviewDate, "dd/MM");
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
                  onClick={() => openConcludeModal(review.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-transform transform cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConcludeReviewModal
        isOpen={isConcludeModalOpen}
        onClose={() => {
          setIsConcludeModalOpen(false);
          setPendingReviewId(null);
        }}
        onRegister={() => handleRegister()}
        onCompleteWithAutomaticRecord={() => handleCompleteDirect()}
      />

      <RegisterStudyModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => handleRegisterSuccess()}
        initialFormData={
          pendingReviewId
            ? {
                tipo_registro: "Revisao",
                revisao_programada_id: String(pendingReviewId),
                data_estudo: new Date().toISOString(),
              }
            : undefined
        }
      />
    </div>
  );
}
