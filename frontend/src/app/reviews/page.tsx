"use client";

import React, { useState, useEffect, useCallback } from "react";
import { parseISO, isSameDay, isBefore, isAfter, startOfDay } from "date-fns";
import { Clock, RotateCcw, CheckCircle2, Filter, Loader2 } from "lucide-react";

// 1. IMPORTAÇÃO DOS TIPOS CENTRAIS
import { Revisao, TemaDeEstudo } from "@/types/types";

// 2. IMPORTAÇÃO DOS SERVIÇOS ESPECÍFICOS
import { reviewService } from "@/services/review-service";
import { subjectService } from "@/services/subject-service";
import { offensivaService } from "@/services/offensiva-service";
import { OfensivaResumo } from "@/types/types";
import { studyService } from "@/services/study-service";

import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewStats } from "@/components/reviews/ReviewStats";
import { ToastBanner, ToastState } from "@/components/ui/ToastBanner";
import { ConcludeReviewModal } from "@/components/reviews/ConcludeReviewModal";
import { RegisterStudyModal } from "@/components/dashboard/RegisterStudyModal";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { PeriodSelect } from "@/components/ui/PeriodSelect";

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [offensivaBase, setOffensivaBase] = useState<OfensivaResumo | null>(
    null
  );

  // 3. ESTADOS TIPADOS CORRETAMENTE
  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [subjects, setSubjects] = useState<TemaDeEstudo[]>([]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Filtros
  type TabId = "pending" | "upcoming" | "completed";
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // period filter
  const [period, setPeriod] = useState<string>(() => {
    try {
      return localStorage.getItem("reviews_period") ?? "30";
    } catch {
      return "30";
    }
  });
  const [periodStart, setPeriodStart] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("reviews_period_start") ?? undefined;
    } catch {
      return undefined;
    }
  });
  const [periodEnd, setPeriodEnd] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("reviews_period_end") ?? undefined;
    } catch {
      return undefined;
    }
  });

  // --- CARREGAMENTO DE DADOS ---
  const fetchData = useCallback(async () => {
    try {
      // Usamos os serviços específicos para buscar apenas o necessário
      const [reviewsRes, themesRes] = await Promise.all([
        reviewService.getAll(),
        subjectService.getAll(),
      ]);

      setReviews(reviewsRes.data || []);
      setSubjects(themesRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    offensivaService
      .getMe()
      .then((res) => setOffensivaBase(res.data || null))
      .catch(() => null);
  }, [fetchData]);

  // --- AÇÕES ---
  const [pendingReviewId, setPendingReviewId] = useState<number | null>(null);
  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const ofensivaMessages = {
    broken: [
      "Ofensiva quebrada. Tente novamente amanhã.",
      "Streak caiu. Recomece amanhã.",
      "Sequência perdida. Amanhã é outro dia.",
    ],
    start: [
      "Parabéns! Você iniciou sua ofensiva.",
      "Primeiro dia de ofensiva! Continue firme.",
      "Streak iniciada! Bora manter.",
    ],
    gain: [
      "Parabéns! +1 dia de ofensiva.",
      "Streak up! Mais um dia na conta.",
      "Sequência aumentou! Ótimo trabalho.",
    ],
    blockGain: [
      "Bloqueio recuperado na ofensiva!",
      "Você ganhou um bloqueio extra.",
      "Bloqueio devolvido. Proteção ativa!",
    ],
    blockUse: [
      "Você usou um bloqueio da ofensiva.",
      "Bloqueio consumido. Fique atento à sequência.",
      "Um bloqueio foi usado. Foque no próximo dia.",
    ],
  };

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

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
      await studyService.create({
        tipo_registro: "Revisao",
        conteudo_estudado: "Concluído (registro automático)",
        data_estudo: new Date().toISOString(),
        tempo_dedicado: 0,
        revisao_programada_id: pendingReviewId,
      } as any);

      await reviewService.complete(pendingReviewId);
      const ofensivaAfter = await offensivaService.getMe();
      handleOffensivaFeedback(offensivaBase, ofensivaAfter.data || null);
      await fetchData();
    } catch (err) {
      console.error("Erro ao concluir revisão", err);
      setToast({ variant: "error", message: "Erro ao concluir revisão." });
      await fetchData();
    } finally {
      setIsConcludeModalOpen(false);
      setPendingReviewId(null);
    }
  };

  const handleRegister = () => {
    setIsConcludeModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSuccess = async () => {
    setIsRegisterModalOpen(false);
    setPendingReviewId(null);
    const ofensivaAfter = await offensivaService.getMe();
    handleOffensivaFeedback(offensivaBase, ofensivaAfter.data || null);
    await fetchData();
  };

  // --- LÓGICA DE DADOS (Processamento) ---
  const today = startOfDay(new Date());

  // persist period
  useEffect(() => {
    try {
      localStorage.setItem("reviews_period", period);
      if (periodStart)
        localStorage.setItem("reviews_period_start", periodStart);
      else localStorage.removeItem("reviews_period_start");
      if (periodEnd) localStorage.setItem("reviews_period_end", periodEnd);
      else localStorage.removeItem("reviews_period_end");
    } catch {
      // ignore
    }
  }, [period, periodStart, periodEnd]);

  function computeRangeFromPeriod() {
    if (period === "all") return null;
    if (period === "custom") {
      const s = periodStart ? new Date(periodStart) : undefined;
      const e = periodEnd ? new Date(periodEnd) : undefined;
      return { start: s, end: e };
    }
    const days = parseInt(period, 10);
    if (Number.isNaN(days)) return null;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    return { start, end };
  }

  const reviewRange = computeRangeFromPeriod();

  function inRange(dateStr: string) {
    if (!reviewRange) return true;
    const d = new Date(dateStr);
    if (reviewRange.start && d < reviewRange.start) return false;
    if (reviewRange.end) {
      const endOfDay = new Date(reviewRange.end);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  }

  const filteredReviews = reviews.filter((r) => {
    const bySubject =
      subjectFilter === "all" ? true : r.tema?.id.toString() === subjectFilter;
    if (!bySubject) return false;
    return inRange(r.data_revisao);
  });

  const pendingList: Revisao[] = [];
  const overdueList: Revisao[] = [];
  const upcomingList: Revisao[] = [];
  const completedList: Revisao[] = [];

  filteredReviews.forEach((r) => {
    const rDate = parseISO(r.data_revisao);
    if (r.status_revisao === "CONCLUIDA") {
      completedList.push(r);
    } else if (isBefore(rDate, today)) {
      overdueList.push(r);
    } else if (isSameDay(rDate, today)) {
      pendingList.push(r);
    } else if (isAfter(rDate, today)) {
      upcomingList.push(r);
    }
  });

  const tabItems = {
    pending: [...overdueList, ...pendingList].sort(
      (a, b) =>
        new Date(a.data_revisao).getTime() - new Date(b.data_revisao).getTime()
    ),
    upcoming: upcomingList.sort(
      (a, b) =>
        new Date(a.data_revisao).getTime() - new Date(b.data_revisao).getTime()
    ),
    completed: completedList.sort(
      (a, b) =>
        new Date(b.data_revisao).getTime() - new Date(a.data_revisao).getTime()
    ),
  };

  const tabs: Array<{
    id: TabId;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }> = [
    {
      id: "pending",
      label: "Pendentes",
      count: overdueList.length + pendingList.length,
      icon: Clock,
      iconColor: "text-amber-600",
    },
    {
      id: "upcoming",
      label: "Próximas",
      count: upcomingList.length,
      icon: RotateCcw,
      iconColor: "text-blue-600",
    },
    {
      id: "completed",
      label: "Concluídas",
      count: completedList.length,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    },
  ];

  // Paginação local configurável
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("reviews_page_size");
      return saved ? parseInt(saved, 10) : 12;
    } catch {
      return 12;
    }
  });

  const currentList = tabItems[activeTab] || [];
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const pageItems = currentList.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    try {
      localStorage.setItem("reviews_page_size", String(pageSize));
    } catch {
      // ignore
    }
  }, [pageSize]);

  // Reset page when filters or tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, subjectFilter]);

  // Ensure current page within range
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-20">
      {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Revisões
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie suas revisões espaçadas
          </p>
        </div>

        {/* 1. Componente de Estatísticas */}
        <ReviewStats
          overdue={overdueList.length}
          pending={pendingList.length}
          completed={completedList.length}
        />

        {/* Filtro de Disciplina */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-48">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm w-full cursor-pointer"
              >
                <option value="all">Todas disciplinas</option>
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.tema}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            <PeriodSelect
              value={period}
              startDate={periodStart}
              endDate={periodEnd}
              hideCustomInputs
              onChange={(v) => {
                setPeriod(v);
                if (v !== "custom") {
                  setPeriodStart(undefined);
                  setPeriodEnd(undefined);
                }
                setPage(1);
              }}
              onChangeRange={(s, e) => {
                setPeriodStart(s);
                setPeriodEnd(e);
                setPage(1);
              }}
            />
          </div>
        </div>

        {period === "custom" && (
          <div className="flex justify-end items-center gap-2 mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="date"
              value={periodStart ?? ""}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <span className="text-slate-400 text-sm">até</span>
            <input
              type="date"
              value={periodEnd ?? ""}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        )}

        {/* Tabs de Navegação */}
        <div className="bg-slate-100 p-1 rounded-xl mb-6 flex flex-col sm:flex-row gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-transform duration-200 transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200
                  ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm scale-100"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 hover:scale-105"
                  }`}
              >
                <tab.icon
                  className={`w-4 h-4 ${
                    isActive ? tab.iconColor : "text-slate-400"
                  }`}
                />
                {tab.label}
                <span
                  className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                    isActive ? "bg-slate-100" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista de Reviews */}
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">
                {activeTab === "pending" && "Nenhuma revisão pendente! 🎉"}
                {activeTab === "upcoming" &&
                  "Nenhuma revisão futura programada."}
                {activeTab === "completed" &&
                  "Nenhuma revisão concluída ainda."}
              </p>
            </div>
          ) : (
            <>
              {pageItems.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onComplete={openConcludeModal}
                  showFutureDate={activeTab === "upcoming"}
                />
              ))}

              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-slate-500">
                  {currentList.length} revisão(ões)
                </div>
                <div className="flex items-center gap-3">
                  <PageSizeSelect
                    value={pageSize}
                    onChange={(next) => {
                      setPageSize(next);
                      setPage(1);
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <div className="px-3 py-1 text-sm text-slate-600">
                      {page} / {totalPages}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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
