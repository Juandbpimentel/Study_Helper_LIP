"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Trash2,
  UserX,
  Database,
  History,
  ChevronRight,
  Save,
} from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { authService, DiaSemana, Usuario } from "@/lib/auth";
import { userService } from "@/services/user-service";
import {
  googleIntegrationService,
  GoogleIntegrationStatus,
} from "@/services/google-integration-service";
import { FormModal } from "@/components/form-modal";
import {
  ProfileFormValues,
  UserSettingsForm,
} from "@/components/profile/user-settings-form";
import { UserProfile } from "@/components/profile/user-profile";
import { ToastBanner, ToastState } from "@/components/ui/ToastBanner";
import { DangerActionModal } from "@/components/settings/DangerActionModal";
import { GeneralSettings } from "@/components/settings/GeneralSettings";

import { ReviewSettings } from "@/components/settings/ReviewSettings";
import { studyService } from "@/services/study-service";
import { useRouter } from "next/navigation";

const emailSchema = z.object({
  novoEmail: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha mínima de 6 caracteres"),
});

const passwordSchema = z.object({
  senhaAtual: z.string().min(6, "Senha mínima de 6 caracteres"),
  novaSenha: z
    .string()
    .min(6, "Senha mínima de 6 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "Use maiúscula, minúscula, número e símbolo"
    ),
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const diaSemanaOptions: { label: string; value: DiaSemana }[] = [
  { label: "Domingo", value: "Dom" },
  { label: "Segunda", value: "Seg" },
  { label: "Terça", value: "Ter" },
  { label: "Quarta", value: "Qua" },
  { label: "Quinta", value: "Qui" },
  { label: "Sexta", value: "Sex" },
  { label: "Sábado", value: "Sab" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAppContext();

  const [emailModal, setEmailModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [googleStatus, setGoogleStatus] =
    useState<GoogleIntegrationStatus | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // States for general settings
  const [dailyGoal, setDailyGoal] = useState(60);
  const [intervals, setIntervals] = useState<number[]>([1, 7, 14]);
  const [primeiroDiaSemana, setPrimeiroDiaSemana] = useState<DiaSemana>("Dom");

  const fetchGoogleStatus = useCallback(async () => {
    setGoogleLoading(true);
    const res = await googleIntegrationService.getStatus();
    if (res.data) {
      setGoogleStatus(res.data);
    } else if (res.error) {
      setToast({ variant: "error", message: res.error });
    }
    setGoogleLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      setDailyGoal(user.metaDiaria || 60);
      setIntervals(
        [...(user.planejamentoRevisoes || [1, 7, 14])].sort((a, b) => a - b)
      );
      setPrimeiroDiaSemana(user.primeiroDiaSemana || "Dom");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchGoogleStatus();
  }, [user, fetchGoogleStatus]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const [modalConfig, setModalConfig] = useState<{
    type: "records" | "data" | "account" | null;
    title: string;
    description: string;
    confirmText: string;
  }>({
    type: null,
    title: "",
    description: "",
    confirmText: "",
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleApiSuccess = (message: string) => {
    setToast({ variant: "success", message });
  };

  const handleApiError = (err: unknown) => {
    const message =
      typeof err === "string"
        ? err
        : typeof err === "object" &&
          err !== null &&
          "error" in err &&
          typeof (err as { error?: unknown }).error === "string"
        ? (err as { error?: string }).error
        : err instanceof Error
        ? err.message
        : "Houve uma falha no servidor. Tente novamente depois.";
    setToast({
      variant: "error",
      message:
        message ?? "Houve uma falha no servidor. Tente novamente depois.",
    });
  };

  const handleProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    const res = await userService.updateProfile(user.id, data);
    if (res.error) {
      handleApiError(res);
    } else if (res.data) {
      setUser(res.data as Usuario);
      handleApiSuccess("Dados atualizados com sucesso!");
    }
    setIsSubmitting(false);
  };

  const handlePreferencesSubmit = async () => {
    if (!user) return;
    setSaving(true);

    // Atualiza planejamento e primeiroDiaSemana via PATCH /users/:id
    // UpdateUserDto exige `nome`, então enviamos o nome atual (email como fallback)
    const nomeValido = user.nome || user.email || "Usuário";

    const res = await userService.updateProfile(user.id, {
      nome: nomeValido,
      planejamentoRevisoes: intervals,
      primeiroDiaSemana: primeiroDiaSemana,
      metaDiaria: dailyGoal,
    });

    if (res.error) {
      handleApiError(res);
    } else if (res.data) {
      setUser(res.data as Usuario);
      handleApiSuccess("Preferências salvas com sucesso!");
    }
    setSaving(false);
  };

  const handleGoogleConnect = async () => {
    try {
      setGoogleLoading(true);
      const authUrl = await googleIntegrationService.startOAuth();
      window.location.href = authUrl;
    } catch (error) {
      handleApiError(error);
      setGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setGoogleLoading(true);
    const res = await googleIntegrationService.disconnect();
    if (!res.ok) {
      handleApiError(res.error);
    } else {
      await fetchGoogleStatus();
      handleApiSuccess("Google Calendar desconectado e IDs limpos.");
    }
    setGoogleLoading(false);
  };

  const handleEmailSubmit = emailForm.handleSubmit(async (data: EmailForm) => {
    const res = await authService.changeEmail({
      novoEmail: data.novoEmail,
      senha: data.senha,
    });
    if (res.error) {
      handleApiError(res);
      return;
    }
    handleApiSuccess("Email atualizado com sucesso!");
    setEmailModal(false);
    emailForm.reset();
    const refreshed = await authService.getProfile();
    if (refreshed.data) setUser(refreshed.data as Usuario);
  });

  const handlePasswordSubmit = passwordForm.handleSubmit(
    async (data: PasswordForm) => {
      const res = await authService.changePassword({
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
      if (res.error) {
        handleApiError(res);
        return;
      }
      handleApiSuccess("Senha atualizada com sucesso!");
      setPasswordModal(false);
      passwordForm.reset();
    }
  );

  const openModal = (type: "records" | "data" | "account") => {
    if (type === "records") {
      setModalConfig({
        type,
        title: "Apagar todos os registros",
        description:
          "Isso removerá permanentemente todo o seu histórico de estudos e as revisões programadas. Seus temas e cronograma permanecerão intactos.",
        confirmText: "Apagar Registros",
      });
    } else if (type === "data") {
      setModalConfig({
        type,
        title: "Apagar todos os dados",
        description:
          "Isso removerá permanentemente seus registros, revisões, temas de estudo e slots do cronograma. Sua conta de usuário será mantida.",
        confirmText: "Apagar Tudo",
      });
    } else {
      setModalConfig({
        type,
        title: "Excluir conta",
        description:
          "Esta ação é irreversível. Todos os seus dados, incluindo perfil, temas, cronograma e histórico, serão apagados permanentemente.",
        confirmText: "Excluir Minha Conta",
      });
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (modalConfig.type === "records") {
        const res = await studyService.deleteAll();
        if (res.error) {
          setToast({ variant: "error", message: res.error });
        } else {
          setToast({ variant: "success", message: "Histórico apagado." });
        }
      } else if (modalConfig.type === "data") {
        // Mantemos a funcionalidade de apagar todos os dados para outra tarefa futura
        setToast({
          variant: "error",
          message: "Funcionalidade indisponível no momento.",
        });
      } else if (modalConfig.type === "account") {
        await userService.deleteAccount(user!.id);
        router.push("/login");
        return;
      }
    } catch (error) {
      console.debug(error);
      setToast({
        variant: "error",
        message: "Ocorreu um erro ao processar a solicitação.",
      });
    } finally {
      setLoading(false);
      setModalConfig({ ...modalConfig, type: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Perfil e Configurações
            </h1>
            <p className="text-slate-500 mt-1">
              Gerencie suas informações e preferências
            </p>
          </div>
        </div>

        {/* User Profile Section */}
        <UserProfile
          user={user}
          onEditEmail={() => setEmailModal(true)}
          onEditPassword={() => setPasswordModal(true)}
        />

        {/* User Info Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Informações do Usuário
          </h2>
          <UserSettingsForm
            user={user}
            onSubmit={handleProfileSubmit}
            onCancel={() => {}}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Google Calendar Integration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Google Calendar
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Sincronize seu cronograma e revisões com o Google Calendar.
              </p>
              {googleStatus?.backend && !googleStatus.backend.enabled && (
                <p className="text-sm text-amber-600 mt-3">
                  Backend sem configuração de Google Calendar:{" "}
                  {googleStatus.backend.issues.join("; ")}
                </p>
              )}
              {googleStatus?.connected && googleStatus.calendarId && (
                <p className="text-xs text-emerald-600 mt-3">
                  Calendário vinculado: {googleStatus.calendarId}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  googleStatus?.connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {googleStatus?.connected ? "Conectado" : "Desconectado"}
              </span>
              {googleStatus?.connected ? (
                <button
                  onClick={handleGoogleDisconnect}
                  disabled={googleLoading}
                  className="ui-btn-secondary px-4 py-2"
                >
                  {googleLoading ? "Processando..." : "Desconectar"}
                </button>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  disabled={
                    googleLoading || googleStatus?.backend?.enabled === false
                  }
                  className="ui-btn-primary px-4 py-2"
                >
                  {googleLoading ? "Abrindo Google..." : "Conectar"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-800">
            Preferências de Estudo
          </h2>

          <GeneralSettings dailyGoal={dailyGoal} onChange={setDailyGoal} />

          <div className="space-y-2">
            <label
              htmlFor="primeiroDiaSemana"
              className="text-sm font-medium text-slate-700"
            >
              Primeiro dia da semana
            </label>
            <select
              id="primeiroDiaSemana"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer"
              value={primeiroDiaSemana}
              onChange={(e) =>
                setPrimeiroDiaSemana(e.target.value as DiaSemana)
              }
            >
              {diaSemanaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <ReviewSettings intervals={intervals} onChange={setIntervals} />

          <div className="flex justify-end">
            <button
              onClick={handlePreferencesSubmit}
              disabled={saving}
              className="ui-btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-indigo-200"
            >
              {saving ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Preferências
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Zona de Perigo
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ações irreversíveis relacionadas aos seus dados
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            <button
              onClick={() => openModal("records")}
              className="w-full p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Apagar todos os registros
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Remove apenas o histórico de estudos e revisões programadas.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 self-center" />
            </button>
            <button
              onClick={() => openModal("data")}
              className="w-full p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Apagar todos os dados
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Reseta sua conta limpando temas, cronograma e registros.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 self-center" />
            </button>
            <button
              onClick={() => openModal("account")}
              className="w-full p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Excluir conta
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Encerra sua conta e remove permanentemente todas as
                  informações.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 self-center" />
            </button>
          </div>
        </div>
      </div>

      <FormModal
        open={emailModal}
        onClose={() => setEmailModal(false)}
        title="Atualizar e-mail"
        onSubmit={handleEmailSubmit}
        submitLabel="Salvar"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Novo e-mail</label>
          <input
            type="email"
            className="ui-input"
            {...emailForm.register("novoEmail")}
          />
          <p className="text-sm text-red-600">
            {emailForm.formState.errors.novoEmail?.message}
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Senha atual</label>
          <input
            type="password"
            className="ui-input"
            {...emailForm.register("senha")}
          />
          <p className="text-sm text-red-600">
            {emailForm.formState.errors.senha?.message}
          </p>
        </div>
      </FormModal>

      <FormModal
        open={passwordModal}
        onClose={() => setPasswordModal(false)}
        title="Atualizar senha"
        onSubmit={handlePasswordSubmit}
        submitLabel="Salvar"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Senha atual</label>
          <input
            type="password"
            className="ui-input"
            {...passwordForm.register("senhaAtual")}
          />
          <p className="text-sm text-red-600">
            {passwordForm.formState.errors.senhaAtual?.message}
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Nova senha</label>
          <input
            type="password"
            className="ui-input"
            {...passwordForm.register("novaSenha")}
          />
          <p className="text-sm text-red-600">
            {passwordForm.formState.errors.novaSenha?.message}
          </p>
        </div>
      </FormModal>

      <DangerActionModal
        isOpen={modalConfig.type !== null}
        onClose={() => setModalConfig({ ...modalConfig, type: null })}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        loading={loading}
      />
    </div>
  );
}
