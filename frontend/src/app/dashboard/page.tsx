"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  format,
  isSameDay,
  parseISO,
  isBefore,
  startOfDay,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { useAppContext } from "@/context/app-context";
import { authService, Usuario } from "@/lib/auth";

import {
  Revisao,
  SlotCronograma,
  RegistroEstudo,
  TemaDeEstudo,
} from "@/types/types";

import { dashboardService } from "@/services/dashboard-service";
import { scheduleService } from "@/services/schedule-service";
import { subjectService } from "@/services/subject-service";

import { StatCard } from "@/components/ui/StatCard";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";
import { ReviewList } from "@/components/dashboard/ReviewList";
import { RecentStudies } from "@/components/dashboard/RecentStudies";
import { RegisterStudyModal } from "@/components/dashboard/RegisterStudyModal";
import { ScheduleEditor } from "@/components/subjects/ScheduleEditor";

export default function DashboardPage() {
  const { user, setUser } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);

  const [showScheduleEditor, setShowScheduleEditor] = useState(false);

  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [schedule, setSchedule] = useState<SlotCronograma[]>([]);
  const [records, setRecords] = useState<RegistroEstudo[]>([]);
  const [subjects, setSubjects] = useState<TemaDeEstudo[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [dashboardData, themesRes] = await Promise.all([
        dashboardService.getDashboardData(),
        subjectService.getAll(),
      ]);

      setReviews(dashboardData.reviews);
      setSchedule(dashboardData.schedule);
      setRecords(dashboardData.studyRecords);
      setSubjects(themesRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (!user) {
        try {
          const profile = await authService.getProfile();
          if (profile.data) {
            setUser(profile.data as Usuario);
            await loadDashboardData();
          } else {
            window.location.href = "/login";
            return;
          }
        } catch (e) {
          console.error(e);
          window.location.href = "/login";
          return;
        }
      } else {
        await loadDashboardData();
      }
      setLoading(false);
    }

    init();
  }, [user, setUser, loadDashboardData]);

  const handleSaveSchedule = async (
    newScheduleMap: Record<number, number[]>
  ) => {
    try {
      await scheduleService.update(newScheduleMap);
      alert("Cronograma atualizado com sucesso!");
      setShowScheduleEditor(false);
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cronograma.");
    }
  };

  const today = new Date();
  const todayStart = startOfDay(today);

  const pendingReviews = reviews.filter((r) => {
    const rDate = parseISO(r.data_revisao);
    return (
      r.status_revisao !== "CONCLUIDA" &&
      (isSameDay(rDate, today) || isBefore(rDate, todayStart))
    );
  });

  const completedTodayCount = reviews.filter(
    (r) =>
      r.status_revisao === "CONCLUIDA" &&
      isSameDay(parseISO(r.data_revisao), today)
  ).length;

  const todayStudies = records.filter((r) =>
    isSameDay(parseISO(r.data_estudo), today)
  );

  const totalMinutesToday = todayStudies.reduce(
    (acc, curr) => acc + curr.tempo_dedicado,
    0
  );

  const hours = Math.floor(totalMinutesToday / 60);
  const minutes = totalMinutesToday % 60;

  const lastWeekStudiesCount = records.filter((r) => {
    const date = parseISO(r.data_estudo);
    const weekAgo = subDays(today, 7);
    return date >= weekAgo;
  }).length;

  const recentStudiesData = records
    .sort(
      (a, b) =>
        new Date(b.data_estudo).getTime() - new Date(a.data_estudo).getTime()
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Painel de Estudos
            </h1>
            <p className="text-slate-500 mt-1 capitalize">
              {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={() => setIsStudyModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Registrar Estudo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revisões Pendentes"
            value={pendingReviews.length}
            subtitle="para hoje"
            icon={AlertCircle}
            colorClass="bg-orange-200 text-orange-600"
          />
          <StatCard
            title="Revisões Concluídas"
            value={completedTodayCount}
            subtitle="hoje"
            icon={CheckCircle2}
            colorClass="bg-emerald-200 text-emerald-600"
          />
          <StatCard
            title="Tempo de Estudo"
            value={`${hours}h ${minutes}m`}
            subtitle="hoje"
            icon={Clock}
            colorClass="bg-blue-200 text-blue-600"
          />
          <StatCard
            title="Estudos Realizados"
            value={lastWeekStudiesCount}
            subtitle="últimos 7 dias"
            icon={TrendingUp}
            colorClass="bg-purple-200 text-purple-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <WeeklySchedule
              schedule={schedule}
              onEdit={() => setShowScheduleEditor(true)}
            />

            <ReviewList
              reviews={pendingReviews}
              onRefresh={loadDashboardData}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">
                  Próximas Revisões
                </h3>
              </div>
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">
                  Nenhuma revisão programada para os próximos dias.
                </p>
              </div>
            </div>
            <RecentStudies studies={recentStudiesData} />
          </div>
        </div>

        <RegisterStudyModal
          isOpen={isStudyModalOpen}
          onClose={() => setIsStudyModalOpen(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />

        <ScheduleEditor
          isOpen={showScheduleEditor}
          onClose={() => setShowScheduleEditor(false)}
          subjects={subjects}
          currentSchedule={schedule}
          onSave={handleSaveSchedule}
        />
      </div>
    </div>
  );
}
