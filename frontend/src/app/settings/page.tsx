"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

// Serviços e Tipos
import { authService, Usuario } from "@/lib/auth";
import { ReviewSettings } from "@/components/settings/ReviewSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";

export default function SettingsPage() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário
  const [reviewIntervals, setReviewIntervals] = useState({
    d1: 1,
    d2: 7,
    d3: 14,
  });
  const [dailyGoal, setDailyGoal] = useState(60);

  // Estados de Ação
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await authService.getProfile();
        if (response.data) {
          const userData = response.data as Usuario;
          setUser(userData);

          // Preenche estados com dados do usuário (se existirem)
          if (
            userData.planejamentoRevisoes &&
            userData.planejamentoRevisoes.length >= 3
          ) {
            setReviewIntervals({
              d1: userData.planejamentoRevisoes[0],
              d2: userData.planejamentoRevisoes[1],
              d3: userData.planejamentoRevisoes[2],
            });
          }

          // Se tiver meta diária no backend, use-a.
          // Como o tipo Usuario atual não tem esse campo explícito,
          // assumimos um valor padrão ou adaptamos o tipo se necessário.
          // if (userData.meta_diaria) setDailyGoal(userData.meta_diaria);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil", error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const updateData = {
        planejamento_revisoes: [
          reviewIntervals.d1,
          reviewIntervals.d2,
          reviewIntervals.d3,
        ],
      };

      // Simulação ou chamada real
      // await authService.updateProfile(updateData);
      console.log("Salvando configurações:", updateData, dailyGoal);

      // Delay artificial para feedback visual (opcional)
      await new Promise((resolve) => setTimeout(resolve, 800));

      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar", error);
      setIsSaving(false);
      alert("Erro ao salvar configurações");
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Configurações
            </h1>
            <p className="text-slate-500 mt-1">
              Personalize sua experiência de estudo
            </p>
          </div>

          {/* Botão de Exportar PDF pode ser adicionado aqui futuramente */}
          <button
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
            onClick={() => alert("Funcionalidade de exportar PDF em breve!")}
          >
            Exportar PDF
          </button>
        </div>

        <div className="space-y-6">
          <ReviewSettings
            intervals={reviewIntervals}
            onChange={setReviewIntervals}
          />

          <GeneralSettings dailyGoal={dailyGoal} onChange={setDailyGoal} />

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 opacity-75">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800">Notificações</h3>
                <p className="text-sm text-slate-500">
                  Receba lembretes por e-mail (Em breve)
                </p>
              </div>
              <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-not-allowed">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 shadow-lg
              ${
                saved
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              } ${isSaving ? "opacity-80 cursor-wait" : ""}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Configurações Salvas!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
