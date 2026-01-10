import React, { useEffect, useState } from "react";
import { X, BookOpen, Save, Loader2, Palette } from "lucide-react";
import { dashboardService, Theme } from "@/services/dashboard-service";

interface RegisterStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterStudyModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterStudyModalProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [newThemeData, setNewThemeData] = useState({
    tema: "",
    cor: "#6366f1",
    descricao: "",
  });

  const [formData, setFormData] = useState({
    tema_id: "",
    data_estudo: new Date().toISOString().split("T")[0],
    conteudo_estudado: "",
    tempo_dedicado: "30",
    anotacoes: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadThemes();
    }
  }, [isOpen]);

  const loadThemes = () => {
    setIsLoading(true);
    dashboardService
      .getThemes()
      .then((res) => {
        if (res.data) setThemes(res.data);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.conteudo_estudado) return;
    if (!isCreatingTheme && !formData.tema_id) return;
    if (isCreatingTheme && !newThemeData.tema) return;

    setIsSubmitting(true);
    try {
      let finalTemaId = formData.tema_id;

      if (isCreatingTheme) {
        const themeRes = await dashboardService.createTheme({
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

      await dashboardService.createStudyRecord({
        tema_id: parseInt(finalTemaId),
        conteudo_estudado: formData.conteudo_estudado,
        data_estudo: new Date(formData.data_estudo).toISOString(),
        tempo_dedicado: parseInt(formData.tempo_dedicado),
        anotacoes: formData.anotacoes,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar. Verifique o console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tema_id: "",
      data_estudo: new Date().toISOString().split("T")[0],
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
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              className={`space-y-1.5 ${
                isCreatingTheme ? "col-span-1 sm:col-span-2" : ""
              }`}
            >
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
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.tema}
                    </option>
                  ))}
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
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Data do Estudo
              </label>
              <input
                type="date"
                required
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
              className="px-5 py-2.5 rounded-xl font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
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
