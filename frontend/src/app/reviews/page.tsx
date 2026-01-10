"use client";

import React, { useState, useEffect, useCallback } from "react";
import { parseISO, isSameDay, isBefore, isAfter, startOfDay } from "date-fns";
import { Clock, RotateCcw, CheckCircle2, Filter, Loader2 } from "lucide-react";

// 1. IMPORTAÇÃO DOS TIPOS CENTRAIS
import { Revisao, TemaDeEstudo } from "@/types/types";

// 2. IMPORTAÇÃO DOS SERVIÇOS ESPECÍFICOS
import { reviewService } from "@/services/review-service";
import { subjectService } from "@/services/subject-service";

import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewStats } from "@/components/reviews/ReviewStats";

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);

  // 3. ESTADOS TIPADOS CORRETAMENTE
  const [reviews, setReviews] = useState<Revisao[]>([]);
  const [subjects, setSubjects] = useState<TemaDeEstudo[]>([]);

  // Filtros
  const [activeTab, setActiveTab] = useState<
    "pending" | "upcoming" | "completed"
  >("pending");
  const [subjectFilter, setSubjectFilter] = useState("all");

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
  }, [fetchData]);

  // --- AÇÕES ---
  const handleComplete = async (id: number) => {
    try {
      // Otimização visual imediata
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status_revisao: "CONCLUIDA" } : r
        )
      );

      // Chamada ao serviço específico de revisões
      await reviewService.complete(id);

      // Sincroniza para garantir
      fetchData();
    } catch (error) {
      alert("Erro ao concluir revisão.");
      fetchData(); // Reverte em caso de erro
    }
  };

  // --- LÓGICA DE DADOS (Processamento) ---
  const today = startOfDay(new Date());

  const filteredReviews = reviews.filter((r) =>
    subjectFilter === "all" ? true : r.tema?.id.toString() === subjectFilter
  );

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

  const tabs = [
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-20">
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
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="relative">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm w-48 cursor-pointer"
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
        </div>

        {/* Tabs de Navegação */}
        <div className="bg-slate-100 p-1 rounded-xl mb-6 flex flex-col sm:flex-row gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
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
          {tabItems[activeTab].length === 0 ? (
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
            tabItems[activeTab].map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onComplete={handleComplete}
                showFutureDate={activeTab === "upcoming"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
