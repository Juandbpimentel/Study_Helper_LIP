"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// 1. IMPORTAÇÃO DOS TIPOS CENTRAIS
import { Revisao, RegistroEstudo, SlotCronograma } from "@/types/types";

// 2. IMPORTAÇÃO DOS SERVIÇOS
// Usamos o dashboardService para leitura em massa (facade)
import { dashboardService } from "@/services/dashboard-service";
// Usamos o reviewService para ações específicas
import { reviewService } from "@/services/review-service";
import { studyService } from "@/services/study-service";

import { ToastBanner, ToastState } from "@/components/ui/ToastBanner";
import { RecordDetailsModal } from "@/components/records/RecordDetailsModal";
import { DayDetailsModal } from "@/components/calendar/DayDetailsModal";

// --- COMPONENTES AUXILIARES (Badge e Modal) ---

interface DayData {
  dayStudies: RegistroEstudo[];
  dayReviews: Revisao[];
  pendingReviews: Revisao[];
  completedReviews: Revisao[];
  scheduledSubjects: SlotCronograma[];
}

// --- PÁGINA PRINCIPAL ---

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // 3. ESTADOS TIPADOS
  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [schedule, setSchedule] = useState<SlotCronograma[]>([]);
  const [studyRecords, setStudyRecords] = useState<RegistroEstudo[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RegistroEstudo | null>(
    null
  );
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Carregar dados
  const fetchData = useCallback(async () => {
    try {
      // O dashboardService.getDashboardData agora usa os serviços segregados internamente
      const data = await dashboardService.getDashboardData();
      setReviews(data.reviews);
      setSchedule(data.schedule);
      setStudyRecords(data.studyRecords);
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ação: Concluir Revisão (Via ReviewService)
  const handleCompleteReview = async (id: number) => {
    try {
      await reviewService.complete(id);
      await fetchData();
      setToast({ variant: "success", message: "Revisão concluída!" });
    } catch (e) {
      console.error(e);
      setToast({ variant: "error", message: "Erro ao concluir revisão." });
    }
  };

  const openRecord = (recordId: number) => {
    const r = studyRecords.find((s) => s.id === recordId) ?? null;
    if (r) {
      setSelectedRecord(r);
      setShowRecordModal(true);
      return;
    }
    // fallback: fetch from API
    studyService.getById(recordId).then((res) => {
      if (res.data) {
        setSelectedRecord(res.data);
        setShowRecordModal(true);
      } else {
        setToast({
          variant: "error",
          message: res.error || "Registro não encontrado",
        });
      }
    });
  };

  // Cálculos do Calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 = Domingo
  const paddingDays = Array(startDayOfWeek).fill(null);

  // Lógica para filtrar dados por dia
  const getDataForDay = (date: Date): DayData => {
    const dayOfWeek = date.getDay();

    // 1. Estudos (comparar data YYYY-MM-DD)
    const dayStudies = studyRecords.filter((s) =>
      isSameDay(parseISO(s.data_estudo), date)
    );

    // 2. Revisões
    const dayReviews = reviews.filter((r) =>
      isSameDay(parseISO(r.data_revisao), date)
    );
    const pendingReviews = dayReviews.filter(
      (r) => r.status_revisao !== "CONCLUIDA"
    );
    const completedReviews = dayReviews.filter(
      (r) => r.status_revisao === "CONCLUIDA"
    );

    // 3. Cronograma (comparar dia da semana 0-6)
    const scheduledSubjects = schedule.filter(
      (s) => s.dia_semana === dayOfWeek
    );

    return {
      dayStudies,
      dayReviews,
      pendingReviews,
      completedReviews,
      scheduledSubjects,
    };
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetails(true);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const selectedDayData = selectedDate ? getDataForDay(selectedDate) : null;

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header da Página */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Calendário
          </h1>
          <p className="text-slate-500 mt-1">
            Visualize seus estudos e revisões no calendário
          </p>
        </div>

        {/* Card do Calendário */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header do Mês */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold capitalize text-slate-800">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grade do Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {/* Espaços vazios iniciais */}
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="aspect-square p-1" />
              ))}

              {/* Dias do Mês */}
              {daysInMonth.map((day) => {
                const { pendingReviews, completedReviews, dayStudies } =
                  getDataForDay(day);
                const hasEvents =
                  pendingReviews.length > 0 ||
                  completedReviews.length > 0 ||
                  dayStudies.length > 0;
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square p-1 rounded-xl transition-transform duration-200 transform relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200
                      ${
                        isCurrentDay
                          ? "bg-indigo-50 ring-2 ring-indigo-200"
                          : "hover:bg-slate-50"
                      }
                      hover:scale-105 active:scale-95
                    `}
                  >
                    <div
                      className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mx-auto
                      ${
                        isCurrentDay
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "text-slate-700 group-hover:bg-slate-200/50"
                      }`}
                    >
                      {format(day, "d")}
                    </div>

                    {/* Indicadores de Eventos */}
                    {hasEvents && (
                      <div className="flex gap-1 justify-center mt-2 flex-wrap px-1">
                        {pendingReviews.length > 0 && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            title={`${pendingReviews.length} Revisões pendentes`}
                          />
                        )}
                        {completedReviews.length > 0 && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            title="Revisões concluídas"
                          />
                        )}
                        {dayStudies.length > 0 && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                            title="Estudos realizados"
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 justify-center mt-8 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                Estudos
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                Revisões Pendentes
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Revisões Concluídas
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes do Dia */}
        <DayDetailsModal
          isOpen={showDayDetails}
          onClose={() => setShowDayDetails(false)}
          date={selectedDate}
          data={selectedDayData}
          onCompleteReview={handleCompleteReview}
          onOpenRecord={openRecord}
          onToast={setToast}
        />

        {showRecordModal && (
          <RecordDetailsModal
            record={selectedRecord}
            onClose={() => {
              setShowRecordModal(false);
              setSelectedRecord(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
