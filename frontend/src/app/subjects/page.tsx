"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

// 1. IMPORTAÇÃO DOS TIPOS CENTRAIS
import { TemaDeEstudo, SlotCronograma } from "@/types/types";

// 2. IMPORTAÇÃO DOS SERVIÇOS ESPECÍFICOS (Separados)
import { subjectService } from "@/services/subject-service";
import { scheduleService } from "@/services/schedule-service";

import { SubjectManager } from "@/components/subjects/SubjectManager";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";
import { ScheduleEditor } from "@/components/subjects/ScheduleEditor";
import { ToastBanner, ToastState } from "@/components/ui/ToastBanner";

export default function SubjectsPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // 3. USO DOS TIPOS CORRETOS
  const [subjects, setSubjects] = useState<TemaDeEstudo[]>([]);
  const [schedule, setSchedule] = useState<SlotCronograma[]>([]);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchData = useCallback(async () => {
    try {
      // Buscamos dados usando os serviços dedicados
      const [themesRes, scheduleRes] = await Promise.all([
        subjectService.getAll(),
        scheduleService.get(),
      ]);

      setSubjects(themesRes.data || []);
      // O scheduleService.get() retorna Promise<any>, forçamos o tipo aqui
      setSchedule(scheduleRes as unknown as SlotCronograma[]);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ação: Criar Disciplina (Via SubjectService)
  const handleCreateSubject = async (data: { tema: string; cor: string }) => {
    try {
      await subjectService.create(data);
      setToast({ variant: "success", message: "Disciplina criada!" });
      fetchData();
    } catch (error) {
      setToast({
        variant: "error",
        message: "Erro ao criar disciplina. Tente novamente.",
      });
    }
  };

  // Ação: Atualizar Disciplina (Via SubjectService)
  const handleUpdateSubject = async (
    id: number,
    data: { tema: string; cor: string }
  ) => {
    try {
      await subjectService.update(id, data);
      setToast({ variant: "success", message: "Disciplina atualizada!" });
      fetchData();
    } catch (error) {
      setToast({
        variant: "error",
        message: "Erro ao atualizar disciplina.",
      });
    }
  };

  // Ação: Deletar Disciplina (Via SubjectService)
  const handleDeleteSubject = async (id: number) => {
    if (!window.confirm("Tem certeza? Isso pode afetar seu histórico.")) return;
    try {
      await subjectService.delete(id);
      // Atualização otimista da UI
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      setToast({ variant: "error", message: "Erro ao deletar disciplina." });
    }
  };

  // Ação: Salvar Cronograma (Via ScheduleService)
  const handleSaveSchedule = async (
    newScheduleMap: Record<number, number[]>
  ) => {
    try {
      console.log("Salvando cronograma:", newScheduleMap);

      // Chamada real ao serviço
      await scheduleService.update(newScheduleMap);

      setToast({
        variant: "success",
        message: "Cronograma salvo com sucesso!",
      });
      setShowScheduleEditor(false);
      fetchData();
    } catch (error) {
      console.error(error);
      setToast({ variant: "error", message: "Erro ao salvar cronograma." });
    }
  };

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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Disciplinas e Cronograma
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie suas disciplinas e organize seu cronograma semanal
          </p>
        </div>

        <div className="space-y-8">
          <SubjectManager
            subjects={subjects}
            onAdd={handleCreateSubject}
            onUpdate={handleUpdateSubject}
            onDelete={handleDeleteSubject}
          />

          {/* Reutilizando WeeklySchedule com dados brutos */}
          <WeeklySchedule
            schedule={schedule}
            subjects={subjects}
            onEdit={() => setShowScheduleEditor(true)}
          />
        </div>

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
