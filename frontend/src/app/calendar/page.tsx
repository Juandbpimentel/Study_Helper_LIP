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
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

// 1. IMPORTAÇÃO DOS TIPOS CENTRAIS
import { Revisao, RegistroEstudo, SlotCronograma } from "@/types/types";

// 2. IMPORTAÇÃO DOS SERVIÇOS
// Usamos o dashboardService para leitura em massa (facade)
import { dashboardService } from "@/services/dashboard-service";
// Usamos o reviewService para ações específicas
import { reviewService } from "@/services/review-service";

// --- COMPONENTES AUXILIARES (Badge e Modal) ---

// Helper para cor hexadecimal com opacidade
const getBadgeStyle = (color: string = "#6366f1") => {
  return {
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
  };
};

function Badge({ children, className, style }: any) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

// Interface para os dados do dia
interface DayData {
  dayStudies: RegistroEstudo[];
  dayReviews: Revisao[];
  pendingReviews: Revisao[];
  completedReviews: Revisao[];
  scheduledSubjects: SlotCronograma[];
}

// Modal simplificado com Tailwind
function DayDetailsModal({
  isOpen,
  onClose,
  date,
  data,
  onCompleteReview,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  data: DayData | null; // Tipagem melhorada
  onCompleteReview: (id: number) => void;
}) {
  if (!isOpen || !date || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">
              {format(date, "dd 'de' MMMM, EEEE", { locale: ptBR })}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Disciplinas do Cronograma */}
          {data.scheduledSubjects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Cronograma do Dia
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.scheduledSubjects.map((slot) => (
                  <Badge key={slot.id} style={getBadgeStyle(slot.tema?.cor)}>
                    {slot.tema?.tema}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Estudos Realizados */}
          {data.dayStudies.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Estudos Realizados
              </h4>
              <div className="space-y-2">
                {data.dayStudies.map((study) => (
                  <div
                    key={study.id}
                    className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100"
                  >
                    <p className="font-medium text-slate-800 text-sm">
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
              </div>
            </div>
          )}

          {/* Revisões Pendentes */}
          {data.pendingReviews.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <RotateCcw className="w-3 h-3" />
                Revisões Pendentes
              </h4>
              <div className="space-y-2">
                {data.pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {review.registro_origem?.conteudo_estudado || "Revisão"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {review.tema?.tema}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onCompleteReview(review.id)}
                      className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                      title="Concluir Revisão"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revisões Concluídas */}
          {data.completedReviews.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Revisões Concluídas
              </h4>
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
            </div>
          )}

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

// --- PÁGINA PRINCIPAL ---

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // 3. ESTADOS TIPADOS
  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [schedule, setSchedule] = useState<SlotCronograma[]>([]);
  const [studyRecords, setStudyRecords] = useState<RegistroEstudo[]>([]);

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
      fetchData();
    } catch (error) {
      alert("Erro ao concluir revisão");
    }
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
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold capitalize text-slate-800">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
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
                    className={`aspect-square p-1 rounded-xl transition-all duration-200 relative group
                      ${
                        isCurrentDay
                          ? "bg-indigo-50 ring-2 ring-indigo-200"
                          : "hover:bg-slate-50"
                      }
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
        />
      </div>
    </div>
  );
}
