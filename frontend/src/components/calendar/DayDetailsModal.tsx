import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDatePt } from "@/lib/formatters";
import {
  Calendar as CalendarIcon,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { Revisao, RegistroEstudo, SlotCronograma } from "@/types/types";
import { studyService } from "@/services/study-service";
import { ConcludeReviewModal } from "@/components/reviews/ConcludeReviewModal";
import { RegisterStudyModal } from "@/components/dashboard/RegisterStudyModal";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { ToastState } from "@/components/ui/ToastBanner";

// Helper para cor hexadecimal com opacidade
const getBadgeStyle = (color: string = "#6366f1") => {
  return {
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
  } as React.CSSProperties;
};

function Badge({
  children,
  className = "",
  style,
}: React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

interface DayData {
  dayStudies: RegistroEstudo[];
  dayReviews: Revisao[];
  pendingReviews: Revisao[];
  completedReviews: Revisao[];
  scheduledSubjects: SlotCronograma[];
}

export function DayDetailsModal({
  isOpen,
  onClose,
  date,
  data,
  onCompleteReview,
  onOpenRecord,
  onToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  data: DayData | null; // Tipagem melhorada
  onCompleteReview: (id: number) => Promise<void>;
  onOpenRecord?: (recordId: number) => void;
  onToast?: React.Dispatch<React.SetStateAction<ToastState | null>>;
}) {
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [pendingReviewId, setPendingReviewId] = useState<number | null>(null);
  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // pagination for studies within the day modal
  const [studiesPage, setStudiesPage] = useState(1);
  const [studiesPageSize, setStudiesPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("daydetails_studies_page_size");
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  if (!isOpen || !date || !data) return null;

  const complete = async (id: number) => {
    // open modal to choose how to conclude
    setPendingReviewId(id);
    setIsConcludeModalOpen(true);
  };

  const handleCompleteDirectLocal = async () => {
    if (!pendingReviewId) return;
    try {
      setCompletingId(pendingReviewId);
      await studyService.create({
        tipo_registro: "Revisao",
        conteudo_estudado: "Concluído (registro automático)",
        data_estudo: new Date().toISOString(),
        tempo_dedicado: 0,
        revisao_programada_id: pendingReviewId,
      });

      await onCompleteReview(pendingReviewId);
      onToast?.({
        variant: "success",
        message: "Revisão concluída e registro criado.",
      });
    } catch (err) {
      console.error("Erro ao concluir revisão", err);
      onToast?.({ variant: "error", message: "Erro ao concluir revisão." });
    } finally {
      setCompletingId(null);
      setPendingReviewId(null);
      setIsConcludeModalOpen(false);
      setTimeout(() => onToast?.(null), 3000);
    }
  };

  const handleRegister = () => {
    setIsConcludeModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSuccess = async () => {
    setIsRegisterModalOpen(false);
    setPendingReviewId(null);
    // ensure parent updates
    await onCompleteReview(pendingReviewId as number);
  };

  const handleOpenRecord = (rId: number) => {
    if (onOpenRecord) onOpenRecord(rId);
  };

  const studiesTotal = data.dayStudies.length;
  const studiesTotalPages = Math.max(
    1,
    Math.ceil(studiesTotal / studiesPageSize)
  );
  const studiesStart = (studiesPage - 1) * studiesPageSize;
  const studiesPageItems = data.dayStudies.slice(
    studiesStart,
    studiesStart + studiesPageSize
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">
                {formatDatePt(date)}
              </h3>
            </div>
            <div className="text-sm text-slate-500 sm:mt-0 mt-1">
              {format(date as Date, "EEEE", { locale: ptBR }).replace(
                /(^.)/,
                (m) => m.toUpperCase()
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Disciplinas do Cronograma */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Cronograma do Dia
            </h4>
            {data.scheduledSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.scheduledSubjects
                  .slice()
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((slot) => (
                    <Badge key={slot.id} style={getBadgeStyle(slot.tema?.cor)}>
                      #{slot.ordem + 1} {slot.tema?.tema}
                    </Badge>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhum slot no cronograma.
              </p>
            )}
          </div>

          {/* Estudos Realizados */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Registros (Estudos)
            </h4>
            {data.dayStudies.length > 0 ? (
              <div className="space-y-2">
                {studiesPageItems.map((study) => (
                  <div
                    key={study.id}
                    onClick={() => handleOpenRecord(study.id)}
                    className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-all active:scale-99"
                  >
                    <p className="font-medium text-slate-800 text-sm truncate">
                      {study.conteudo_estudado}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">
                        {study.tema?.tema}
                      </span>
                      <span className="text-xs font-medium text-indigo-600">
                        {study.tempo_dedicado} min
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-slate-500">
                    {studiesTotal} registro(s)
                  </div>
                  <div className="flex items-center gap-3">
                    <PageSizeSelect
                      value={studiesPageSize}
                      onChange={(next) => {
                        setStudiesPageSize(next);
                        setStudiesPage(1);
                      }}
                      options={[3, 5, 10, 20]}
                      ariaLabel="Registros por página"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setStudiesPage(Math.max(1, studiesPage - 1))
                        }
                        disabled={studiesPage === 1}
                        className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <div className="px-3 py-1 text-sm text-slate-600">
                        {studiesPage} / {studiesTotalPages}
                      </div>
                      <button
                        onClick={() =>
                          setStudiesPage(
                            Math.min(studiesTotalPages, studiesPage + 1)
                          )
                        }
                        disabled={studiesPage === studiesTotalPages}
                        className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhum registro nesse dia.
              </p>
            )}
          </div>

          {/* Revisões Pendentes */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <RotateCcw className="w-3 h-3" />
              Revisões Pendentes
            </h4>
            {data.pendingReviews.length > 0 ? (
              <div className="space-y-2">
                {data.pendingReviews.map((review) => {
                  const isCompleting = completingId === review.id;
                  return (
                    <div
                      key={review.id}
                      className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {review.registro_origem?.conteudo_estudado ||
                            "Revisão"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {review.tema?.tema}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => complete(review.id)}
                        disabled={isCompleting}
                        className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        title="Concluir Revisão"
                      >
                        {isCompleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhuma revisão pendente.
              </p>
            )}
          </div>

          {/* Revisões Concluídas */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Revisões Concluídas
            </h4>
            {data.completedReviews.length > 0 ? (
              <div className="space-y-2">
                {data.completedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 opacity-75"
                  >
                    <p className="font-medium text-slate-800 text-sm line-through decoration-slate-400">
                      {review.registro_origem?.conteudo_estudado}
                    </p>
                    <span className="text-xs text-slate-500 mt-1 block">
                      {review.tema?.tema}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhuma revisão concluída.
              </p>
            )}
          </div>

          <ConcludeReviewModal
            isOpen={isConcludeModalOpen}
            onClose={() => {
              setIsConcludeModalOpen(false);
              setPendingReviewId(null);
            }}
            onRegister={() => handleRegister()}
            onCompleteWithAutomaticRecord={() => handleCompleteDirectLocal()}
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

          {/* Estado Vazio */}
          {!data.dayStudies.length &&
            !data.pendingReviews.length &&
            !data.completedReviews.length &&
            !data.scheduledSubjects.length && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">
                  Nenhum evento registrado neste dia.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
