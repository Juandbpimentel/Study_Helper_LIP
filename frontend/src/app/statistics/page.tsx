"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subDays,
  parseISO,
  eachDayOfInterval,
  format,
  isSameDay,
  differenceInDays,
  startOfDay as fnsStartOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  BookOpen,
  RotateCcw,
  Target,
  Download,
  Flame,
} from "lucide-react";

import {
  Revisao,
  RegistroEstudo,
  TemaDeEstudo,
  OfensivaResumo,
} from "@/types/types";

import { dashboardService } from "@/services/dashboard-service";
import { subjectService } from "@/services/subject-service";
import { reportService } from "@/services/report-service";
import { offensivaService } from "@/services/offensiva-service";

import { StatCard } from "@/components/ui/StatCard";
import { StatisticsCharts } from "@/components/statistics/StatisticsCharts";
import { SubjectsTable } from "@/components/statistics/SubjectsTable";
import { PeriodSelect } from "@/components/ui/PeriodSelect";

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(() => {
    try {
      return localStorage.getItem("stats_period") ?? "7";
    } catch {
      return "7";
    }
  });
  const [periodStart, setPeriodStart] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("stats_period_start") ?? undefined;
    } catch {
      return undefined;
    }
  });
  const [periodEnd, setPeriodEnd] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("stats_period_end") ?? undefined;
    } catch {
      return undefined;
    }
  });

  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [studyRecords, setStudyRecords] = useState<RegistroEstudo[]>([]);
  const [subjects, setSubjects] = useState<TemaDeEstudo[]>([]);
  const [offensiva, setOffensiva] = useState<OfensivaResumo | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // 3. Ajuste na chamada da API: usa subjectService.getAll()
      const [dashboardData, themesRes, ofensivaRes] = await Promise.all([
        dashboardService.getDashboardData(),
        subjectService.getAll(),
        offensivaService.getMe(),
      ]);
      setReviews(dashboardData.reviews);
      setStudyRecords(dashboardData.studyRecords);
      setSubjects(themesRes.data || []);
      setOffensiva(ofensivaRes.data || null);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    try {
      localStorage.setItem("stats_period", period);
      if (periodStart) localStorage.setItem("stats_period_start", periodStart);
      else localStorage.removeItem("stats_period_start");
      if (periodEnd) localStorage.setItem("stats_period_end", periodEnd);
      else localStorage.removeItem("stats_period_end");
    } catch {
      // ignore
    }
  }, [period, periodStart, periodEnd]);

  function computeRange() {
    if (period === "custom") {
      const s = periodStart ? new Date(periodStart) : undefined;
      const e = periodEnd ? new Date(periodEnd) : undefined;
      return { start: s, end: e };
    }
    if (period === "all") return null;
    const days = parseInt(period, 10);
    if (Number.isNaN(days)) return null;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    return { start, end };
  }

  const range = computeRange();

  const handleExportPdf = useCallback(async () => {
    try {
      setExporting(true);
      const params: Record<string, string> = {};
      if (range?.start) params.dataInicial = range.start.toISOString();
      if (range?.end)
        params.dataFinal = (() => {
          const end = new Date(range.end);
          end.setHours(23, 59, 59, 999);
          return end.toISOString();
        })();

      const blob = await reportService.downloadResumoPdf(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio_resumo.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF", err);
    } finally {
      setExporting(false);
    }
  }, [range]);

  function endOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  function inRange(dateStr: string) {
    if (!range) return true;
    const d = new Date(dateStr);
    if (range.start && d < range.start) return false;
    if (range.end) {
      const eod = endOfDay(range.end);
      if (d > eod) return false;
    }
    return true;
  }

  const now = new Date();
  const effectiveEndDate = range?.end ? endOfDay(range.end) : endOfDay(now);

  const effectiveStartDate = (() => {
    if (range?.start) return fnsStartOfDay(range.start);
    if (range) {
      // custom com apenas end (ou inválido) -> usa janela padrão de 7 dias
      return subDays(effectiveEndDate, 6);
    }
    // "all": inicia no primeiro registro disponível (fallback hoje)
    const candidates: number[] = [];
    for (const s of studyRecords) {
      const t = new Date(s.data_estudo).getTime();
      if (!Number.isNaN(t)) candidates.push(t);
    }
    for (const r of reviews) {
      const t = new Date(r.data_revisao).getTime();
      if (!Number.isNaN(t)) candidates.push(t);
    }
    return candidates.length
      ? new Date(Math.min(...candidates))
      : subDays(effectiveEndDate, 6);
  })();

  const periodDays = Math.max(
    1,
    differenceInDays(effectiveEndDate, effectiveStartDate) + 1
  );

  const filteredStudies = studyRecords.filter((s) => inRange(s.data_estudo));

  // Agora filtramos revisões agendadas concluídas OU registros do tipo Revisão
  const totalReviewsCompleted = studyRecords.filter(
    (s) => s.tipo_registro === "Revisao" && inRange(s.data_estudo)
  ).length;

  const totalStudyMinutes = filteredStudies.reduce(
    (sum, s) => sum + s.tempo_dedicado,
    0
  );
  const totalStudies = filteredStudies.length;
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
      const subjectReviewsCount = filteredStudies.filter(
        (s) =>
          s.tipo_registro === "Revisao" &&
          (s.tema_id === subject.id || s.tema?.id === subject.id)
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

  const daysInPeriod = eachDayOfInterval({
    start: effectiveStartDate,
    end: effectiveEndDate,
  });
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
          <div className="flex items-center gap-3">
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
              }}
              onChangeRange={(s, e) => {
                setPeriodStart(s);
                setPeriodEnd(e);
              }}
            />
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg shadow-sm transition-all"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Gerando..." : "Exportar PDF"}
            </button>
          </div>
        </div>

        {period === "custom" && (
          <div className="flex justify-end items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="date"
              value={periodStart ?? ""}
              onChange={(e) => {
                setPeriodStart(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <span className="text-slate-400 text-sm">até</span>
            <input
              type="date"
              value={periodEnd ?? ""}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tempo Total"
            value={`${Math.floor(totalStudyMinutes / 60)}h ${
              totalStudyMinutes % 60
            }m`}
            subtitle={
              period === "all" ? "em todo o período" : `em ${periodDays} dias`
            }
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
          {offensiva && (
            <StatCard
              title="Ofensiva"
              value={`${offensiva.atual}d`}
              subtitle={`Bloqueios: ${offensiva.bloqueiosRestantes}/${offensiva.bloqueiosTotais}`}
              icon={Flame}
              colorClass="bg-orange-100 text-orange-600"
            />
          )}
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
