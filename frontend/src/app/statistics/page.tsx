"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subDays,
  isWithinInterval,
  parseISO,
  eachDayOfInterval,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, BookOpen, RotateCcw, Target } from "lucide-react";

import { Revisao, RegistroEstudo, TemaDeEstudo } from "@/types/types";

import { dashboardService } from "@/services/dashboard-service";
import { subjectService } from "@/services/subject-service";

import { StatCard } from "@/components/ui/StatCard";
import { StatisticsFilters } from "@/components/statistics/StatisticsFilters";
import { StatisticsCharts } from "@/components/statistics/StatisticsCharts";
import { SubjectsTable } from "@/components/statistics/SubjectsTable";

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7");

  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [studyRecords, setStudyRecords] = useState<RegistroEstudo[]>([]);
  const [subjects, setSubjects] = useState<TemaDeEstudo[]>([]);

  const fetchData = useCallback(async () => {
    try {
      // 3. Ajuste na chamada da API: usa subjectService.getAll()
      const [dashboardData, themesRes] = await Promise.all([
        dashboardService.getDashboardData(),
        subjectService.getAll(),
      ]);
      setReviews(dashboardData.reviews);
      setStudyRecords(dashboardData.studyRecords);
      setSubjects(themesRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodDays = parseInt(period);
  const endDate = new Date();
  const startDate = subDays(endDate, periodDays - 1);

  const filteredStudies = studyRecords.filter((s) => {
    const studyDate = parseISO(s.data_estudo);
    return isWithinInterval(studyDate, { start: startDate, end: endDate });
  });

  const filteredReviews = reviews.filter((r) => {
    const reviewDate = parseISO(r.data_revisao);
    return (
      r.status_revisao === "CONCLUIDA" &&
      isWithinInterval(reviewDate, { start: startDate, end: endDate })
    );
  });

  const totalStudyMinutes = filteredStudies.reduce(
    (sum, s) => sum + s.tempo_dedicado,
    0
  );
  const totalStudies = filteredStudies.length;
  const totalReviewsCompleted = filteredReviews.length;
  const avgStudyTime =
    totalStudies > 0 ? Math.round(totalStudyMinutes / totalStudies) : 0;

  const studyBySubject = subjects
    .map((subject) => {
      const subjectStudies = filteredStudies.filter(
        (s) => s.tema_id === subject.id || s.tema?.id === subject.id
      );
      const totalMinutes = subjectStudies.reduce(
        (sum, s) => sum + s.tempo_dedicado,
        0
      );
      const subjectReviewsCount = filteredReviews.filter(
        (r) => r.tema?.id === subject.id
      ).length;

      return {
        id: subject.id,
        name: subject.tema,
        minutes: totalMinutes,
        hours: (totalMinutes / 60).toFixed(1),
        color: subject.cor,
        count: subjectStudies.length,
        reviewsCount: subjectReviewsCount,
      };
    })
    .filter((s) => s.minutes > 0 || s.reviewsCount > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyData = daysInPeriod.map((day) => {
    const dayStudies = filteredStudies.filter((s) =>
      isSameDay(parseISO(s.data_estudo), day)
    );
    return {
      date: format(day, "dd/MM"),
      fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
      estudos: dayStudies.reduce((sum, s) => sum + s.tempo_dedicado, 0),
    };
  });

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Estatísticas
            </h1>
            <p className="text-slate-500 mt-1">
              Acompanhe seu desempenho de estudos
            </p>
          </div>
          <StatisticsFilters period={period} onChange={setPeriod} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tempo Total"
            value={`${Math.floor(totalStudyMinutes / 60)}h ${
              totalStudyMinutes % 60
            }m`}
            subtitle={`em ${periodDays} dias`}
            icon={Clock}
            colorClass="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            title="Estudos Realizados"
            value={totalStudies}
            subtitle={`média: ${(totalStudies / periodDays).toFixed(1)}/dia`}
            icon={BookOpen}
            colorClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Revisões Concluídas"
            value={totalReviewsCompleted}
            subtitle="no período"
            icon={RotateCcw}
            colorClass="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Tempo Médio/Estudo"
            value={`${avgStudyTime}min`}
            subtitle="por sessão"
            icon={Target}
            colorClass="bg-purple-100 text-purple-600"
          />
        </div>

        <StatisticsCharts
          dailyData={dailyData}
          studyBySubject={studyBySubject}
        />

        <div className="mt-8">
          <SubjectsTable data={studyBySubject} />
        </div>
      </div>
    </div>
  );
}
