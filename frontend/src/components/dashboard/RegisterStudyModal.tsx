import React, { useEffect, useState } from "react";
import { X, BookOpen, Save, Loader2, Palette } from "lucide-react";

import { Revisao, SlotCronograma, TemaDeEstudo } from "@/types/types";
import { subjectService } from "@/services/subject-service";
import { studyService } from "@/services/study-service";
import { scheduleService } from "@/services/schedule-service";
import { reviewService } from "@/services/review-service";
import { formatDatePt } from "@/lib/formatters";

type RegistroTipoUI = "EstudoDeTema" | "EstudoAberto" | "Revisao";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const pad2 = (n: number) => String(n).padStart(2, "0");

function formatLocalDateTimeInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

interface RegisterStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // optional initial form data to prefill the modal (useful when opening from a review)
  initialFormData?: Partial<{
    tipo_registro: RegistroTipoUI;
    tema_id: string;
    slot_id: string;
    revisao_programada_id: string;
    data_estudo: string;
    conteudo_estudado: string;
    tempo_dedicado: string;
    anotacoes: string;
  }>;
}

export function RegisterStudyModal({
  isOpen,
  onClose,
  onSuccess,
  initialFormData,
}: RegisterStudyModalProps) {
  const [themes, setThemes] = useState<TemaDeEstudo[]>([]);
  const [slots, setSlots] = useState<SlotCronograma[]>([]);
  const [revisions, setRevisions] = useState<Revisao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [newThemeData, setNewThemeData] = useState({
    tema: "",
    cor: "#6366f1",
    descricao: "",
  });

  const [formData, setFormData] = useState({
    tipo_registro: "EstudoAberto" as RegistroTipoUI,
    tema_id: "",
    slot_id: "",
    revisao_programada_id: "",
    data_estudo: formatLocalDateTimeInput(new Date()),
    conteudo_estudado: "",
    tempo_dedicado: "30",
    anotacoes: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadModalData();
      // apply optional initialFormData when opening
      if (initialFormData) {
        const prefill: Partial<typeof formData> = { ...initialFormData };
        if (prefill.data_estudo) {
          try {
            prefill.data_estudo = formatLocalDateTimeInput(
              new Date(prefill.data_estudo)
            );
          } catch {
            prefill.data_estudo = formatLocalDateTimeInput(new Date());
          }
        }
        setFormData((prev) => ({ ...prev, ...prefill }));
        if (
          initialFormData.tipo_registro &&
          initialFormData.tipo_registro !== "EstudoAberto"
        ) {
          setIsCreatingTheme(false);
        }
      }
    } else {
      // when closing, reset any prefills
      resetForm();
    }
  }, [isOpen, initialFormData]);

  const loadModalData = () => {
    setIsLoading(true);
    Promise.all([
      subjectService.getAll(),
      scheduleService.get(),
      reviewService.getAll(),
    ])
      .then(([themesRes, slotsRes, reviewsRes]) => {
        if (themesRes.data) setThemes(themesRes.data);
        setSlots(Array.isArray(slotsRes) ? slotsRes : []);
        setRevisions(reviewsRes.data || []);
      })
      .catch((err) => console.error("Erro ao carregar dados do modal", err))
      .finally(() => setIsLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.conteudo_estudado) return;

    const tipo = formData.tipo_registro;

    if (tipo === "EstudoDeTema") {
      if (!formData.slot_id) return;
    }
    if (tipo === "EstudoAberto") {
      if (!isCreatingTheme && !formData.tema_id) return;
      if (isCreatingTheme && !newThemeData.tema) return;
    }
    if (tipo === "Revisao") {
      if (!formData.revisao_programada_id) return;
    }

    setIsSubmitting(true);
    try {
      // prevent future study registrations
      const selectedDate = new Date(formData.data_estudo);
      const now = new Date();
      if (selectedDate.getTime() > now.getTime()) {
        setFormError("Data do estudo não pode ser no futuro.");
        setIsSubmitting(false);
        return;
      }

      let temaId: number | undefined = undefined;

      if (formData.tipo_registro === "EstudoDeTema") {
        const selectedSlotId = parseInt(formData.slot_id);
        const slot = slots.find((s) => s.id === selectedSlotId);
        if (!slot) {
          throw new Error("Slot selecionado não encontrado.");
        }
        temaId = slot.tema_id;
      }

      if (formData.tipo_registro === "EstudoAberto") {
        let finalTemaId = formData.tema_id;

        if (isCreatingTheme) {
          const themeRes = await subjectService.create({
            tema: newThemeData.tema,
            cor: newThemeData.cor,
            descricao: newThemeData.descricao,
          });

          if (themeRes.data && themeRes.data.id) {
            finalTemaId = themeRes.data.id.toString();
          } else {
            throw new Error("Falha ao criar tema: ID não retornado.");
          }
        }

        temaId = parseInt(finalTemaId);
      }

      await studyService.create({
        tipo_registro: formData.tipo_registro,
        conteudo_estudado: formData.conteudo_estudado,
        data_estudo: new Date(formData.data_estudo).toISOString(),
        tempo_dedicado: parseInt(formData.tempo_dedicado),
        anotacoes: formData.anotacoes,
        tema_id: temaId,
        slot_id:
          formData.tipo_registro === "EstudoDeTema"
            ? parseInt(formData.slot_id)
            : undefined,
        revisao_programada_id:
          formData.tipo_registro === "Revisao"
            ? parseInt(formData.revisao_programada_id)
            : undefined,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setFormError(
        "Não foi possível salvar. Verifique os campos e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormError(null);
    setFormData({
      tipo_registro: "EstudoAberto",
      tema_id: "",
      slot_id: "",
      revisao_programada_id: "",
      data_estudo: formatLocalDateTimeInput(new Date()),
      conteudo_estudado: "",
      tempo_dedicado: "30",
      anotacoes: "",
    });
    setIsCreatingTheme(false);
    setNewThemeData({ tema: "", cor: "#6366f1", descricao: "" });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Registrar Estudo
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {formError && (
            <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Tipo de Registro *
            </label>
            <select
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-700"
              value={formData.tipo_registro}
              onChange={(e) => {
                const next = e.target.value as RegistroTipoUI;
                setFormData({
                  ...formData,
                  tipo_registro: next,
                  tema_id: "",
                  slot_id: "",
                  revisao_programada_id: "",
                });
                // criação de tema só faz sentido para EstudoAberto
                if (next !== "EstudoAberto") {
                  setIsCreatingTheme(false);
                }
              }}
            >
              <option value="EstudoAberto">Estudo Aberto</option>
              <option value="EstudoDeTema">Estudo de Tema (cronograma)</option>
              <option value="Revisao">Revisão</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              className={`space-y-1.5 ${
                isCreatingTheme ? "col-span-1 sm:col-span-2" : ""
              }`}
            >
              {formData.tipo_registro === "EstudoAberto" && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">
                      Disciplina *
                    </label>
                    {isCreatingTheme && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingTheme(false)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Cancelar criação
                      </button>
                    )}
                  </div>

                  {!isCreatingTheme ? (
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-700"
                      value={formData.tema_id}
                      onChange={(e) => {
                        if (e.target.value === "NEW_THEME") {
                          setIsCreatingTheme(true);
                          setFormData({ ...formData, tema_id: "" });
                        } else {
                          setFormData({ ...formData, tema_id: e.target.value });
                        }
                      }}
                    >
                      <option value="" disabled>
                        Selecione a disciplina
                      </option>
                      {isLoading ? (
                        <option disabled>Carregando disciplinas...</option>
                      ) : (
                        themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.tema}
                          </option>
                        ))
                      )}
                      <option
                        value="NEW_THEME"
                        className="font-semibold text-indigo-600 bg-indigo-50"
                      >
                        + Adicionar nova disciplina
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-3 animate-in fade-in zoom-in duration-200 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <input
                            type="color"
                            className="h-[42px] w-[42px] p-0.5 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
                            value={newThemeData.cor}
                            onChange={(e) =>
                              setNewThemeData({
                                ...newThemeData,
                                cor: e.target.value,
                              })
                            }
                            title="Cor da disciplina"
                          />
                          <Palette className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-md" />
                        </div>
                        <input
                          type="text"
                          required
                          autoFocus
                          placeholder="Nome da disciplina (Ex: Física)"
                          className="flex-1 px-3 py-2.5 rounded-lg border border-indigo-300 ring-2 ring-indigo-100 focus:outline-none text-slate-700 placeholder:text-slate-400 min-w-0"
                          value={newThemeData.tema}
                          onChange={(e) =>
                            setNewThemeData({
                              ...newThemeData,
                              tema: e.target.value,
                            })
                          }
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Descrição curta (opcional)"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-700"
                        value={newThemeData.descricao}
                        onChange={(e) =>
                          setNewThemeData({
                            ...newThemeData,
                            descricao: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </>
              )}

              {formData.tipo_registro === "EstudoDeTema" && (
                <>
                  <label className="text-sm font-semibold text-slate-700">
                    Slot do Cronograma *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-700"
                    value={formData.slot_id}
                    onChange={(e) =>
                      setFormData({ ...formData, slot_id: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Selecione um slot
                    </option>
                    {isLoading ? (
                      <option disabled>Carregando cronograma...</option>
                    ) : (
                      slots
                        .slice()
                        .sort(
                          (a, b) =>
                            a.dia_semana - b.dia_semana || a.ordem - b.ordem
                        )
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {weekDays[slot.dia_semana] || "Dia"} • #
                            {slot.ordem + 1} • {slot.tema?.tema || "Disciplina"}
                          </option>
                        ))
                    )}
                  </select>
                </>
              )}

              {formData.tipo_registro === "Revisao" && (
                <>
                  <label className="text-sm font-semibold text-slate-700">
                    Revisão Programada *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-700"
                    value={formData.revisao_programada_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revisao_programada_id: e.target.value,
                      })
                    }
                  >
                    <option value="" disabled>
                      Selecione uma revisão
                    </option>
                    {isLoading ? (
                      <option disabled>Carregando revisões...</option>
                    ) : (
                      revisions
                        .filter((r) => r.status_revisao !== "CONCLUIDA")
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.tema?.tema || "Disciplina"} •{" "}
                            {formatDatePt(r.data_revisao)}
                          </option>
                        ))
                    )}
                  </select>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Data e Hora do Estudo
              </label>
              <input
                type="datetime-local"
                required
                max={formatLocalDateTimeInput(new Date())}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-700"
                value={formData.data_estudo}
                onChange={(e) =>
                  setFormData({ ...formData, data_estudo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Tema/Conteúdo Estudado *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Funções Trigonométricas"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400"
              value={formData.conteudo_estudado}
              onChange={(e) =>
                setFormData({ ...formData, conteudo_estudado: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Tempo de Estudo
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-700"
              value={formData.tempo_dedicado}
              onChange={(e) =>
                setFormData({ ...formData, tempo_dedicado: e.target.value })
              }
            >
              <option value="15">⏱️ 15 min</option>
              <option value="30">⏱️ 30 min</option>
              <option value="45">⏱️ 45 min</option>
              <option value="60">⏱️ 60 min (1h)</option>
              <option value="90">⏱️ 90 min (1h 30m)</option>
              <option value="120">⏱️ 120 min (2h)</option>
              <option value="180">⏱️ 180 min (3h)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Anotações (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Observações sobre o estudo..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none placeholder:text-slate-400"
              value={formData.anotacoes}
              onChange={(e) =>
                setFormData({ ...formData, anotacoes: e.target.value })
              }
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-200 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isCreatingTheme ? "Criando e Salvando..." : "Salvando..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isCreatingTheme ? "Salvar Novo Estudo" : "Salvar Estudo"}
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-center text-slate-400 mt-2">
            Ao salvar, as revisões D+1, D+7 e D+14 serão criadas
            automaticamente.
          </p>
        </form>
      </div>
    </div>
  );
}
