"use client";

import { useEffect, useState } from "react";
import { Control, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppContext } from "@/context/app-context";
import { authService, userService, DiaSemana, Usuario } from "@/lib/auth";
import { FormModal } from "@/components/form-modal";

const diaSemanaValues = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sab",
] as const;

const profileSchema = z.object({
  nome: z.string().min(2, "Informe um nome"),
  primeiroDiaSemana: z.enum(diaSemanaValues),
  planejamentoRevisoes: z
    .array(z.number().int().positive())
    .min(1, "Inclua pelo menos um dia")
    .refine((arr) => new Set(arr).size === arr.length, "Não repetir valores"),
});

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

type ProfileForm = z.infer<typeof profileSchema>;
type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type ApiErrorShape = { error?: string; statusCode?: number };

const diaSemanaOptions: { label: string; value: DiaSemana }[] = [
  { label: "Domingo", value: "Dom" },
  { label: "Segunda", value: "Seg" },
  { label: "Terça-feira", value: "Ter" },
  { label: "Quarta-feira", value: "Qua" },
  { label: "Quinta-feira", value: "Qui" },
  { label: "Sexta-feira", value: "Sex" },
  { label: "Sábado", value: "Sab" },
];

const sortedSet = (values: number[]) => [...values].sort((a, b) => a - b);

function usePlanejamentoValues(control: Control<ProfileForm>) {
  return useWatch({
    control,
    name: "planejamentoRevisoes",
    defaultValue: [],
  }) as number[];
}

export default function ProfilePage() {
  const { user, setUser } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [planInput, setPlanInput] = useState("");
  const [emailModal, setEmailModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "error";
  } | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: user
      ? {
          nome: user.nome || "",
          primeiroDiaSemana: user.primeiroDiaSemana || "Dom",
          planejamentoRevisoes: [
            ...(user.planejamentoRevisoes ?? [1, 7, 14]),
          ].sort((a, b) => a - b),
        }
      : undefined,
  });
  const { reset } = profileForm;
  const planejamentoValues = usePlanejamentoValues(profileForm.control);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleApiError = (res: ApiErrorShape) => {
    const isServerError = res.statusCode === 500;
    const fallback = isServerError
      ? "Houve uma falha no servidor. Tente novamente depois."
      : "Não foi possível completar a ação.";
    const messageToShow = isServerError ? fallback : res.error || fallback;
    setError(messageToShow);
    setToast({ message: messageToShow, variant: "error" });
  };

  // Keep form inputs in sync with the user from context when it changes.
  useEffect(() => {
    if (!user || editing) return;
    reset({
      nome: user.nome || "",
      primeiroDiaSemana: user.primeiroDiaSemana || "Dom",
      planejamentoRevisoes: [...(user.planejamentoRevisoes ?? [1, 7, 14])].sort(
        (a, b) => a - b
      ),
    });
  }, [user, editing, reset]);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const addPlano = () => {
    const parsed = Number(planInput);
    if (Number.isNaN(parsed)) return;
    const arr: number[] = planejamentoValues;
    if (parsed <= 0) return;
    if (arr.includes(parsed)) return;
    const next = sortedSet([...arr, parsed]);
    profileForm.setValue("planejamentoRevisoes", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPlanInput("");
  };

  const removePlano = (value: number) => {
    const arr: number[] = planejamentoValues;
    const next = sortedSet(arr.filter((v) => v !== value));
    profileForm.setValue("planejamentoRevisoes", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleProfileSubmit = profileForm.handleSubmit(
    async (data: ProfileForm) => {
      setError(null);
      setMessage(null);
      const res = await userService.updateProfile(user.id, data);
      if (res.error) {
        handleApiError(res);
        return;
      }
      if (res.data) {
        setUser(res.data as Usuario);
        setMessage("Dados atualizados");
        setEditing(false);
      }
    }
  );

  const handleEmailSubmit = emailForm.handleSubmit(async (data: EmailForm) => {
    setError(null);
    setMessage(null);
    const res = await authService.changeEmail({
      novoEmail: data.novoEmail,
      senha: data.senha,
    });
    if (res.error) {
      handleApiError(res);
      return;
    }
    setMessage("Email atualizado");
    setEmailModal(false);
    emailForm.reset();
    const refreshed = await authService.getProfile();
    if (refreshed.data) setUser(refreshed.data as Usuario);
  });

  const handlePasswordSubmit = passwordForm.handleSubmit(
    async (data: PasswordForm) => {
      setError(null);
      setMessage(null);
      const res = await authService.changePassword({
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
      if (res.error) {
        handleApiError(res);
        return;
      }
      setMessage("Senha atualizada");
      setPasswordModal(false);
      passwordForm.reset();
    }
  );

  const card = "ui-card";

  return (
    <div className="app-page-surface py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-2xl shadow p-6 sm:p-8 ${card}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Perfil
              </p>
              <h1 className="text-3xl font-semibold">Informações do usuário</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEmailModal(true)}
                className="ui-btn-ghost text-sm"
              >
                Editar e-mail
              </button>
              <button
                onClick={() => setPasswordModal(true)}
                className="ui-btn-ghost text-sm"
              >
                Editar senha
              </button>
            </div>
          </div>

          {message && <div className="ui-alert-success mb-4">{message}</div>}
          {error && <div className="ui-alert-error mb-4">{error}</div>}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              // Prevent any implicit submits; saving is handled explicitly.
              e.preventDefault();
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              {editing ? (
                <input className="ui-input" {...profileForm.register("nome")} />
              ) : (
                <p className="text-lg font-semibold">{user.nome || "—"}</p>
              )}
              <p className="text-sm text-red-600">
                {profileForm.formState.errors.nome?.message}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Primeiro dia da semana
              </label>
              {editing ? (
                <select
                  className="ui-input"
                  {...profileForm.register("primeiroDiaSemana")}
                >
                  {diaSemanaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg font-semibold">
                  {diaSemanaOptions.find(
                    (d) => d.value === user.primeiroDiaSemana
                  )?.label || "—"}
                </p>
              )}
              <p className="text-sm text-red-600">
                {
                  profileForm.formState.errors.primeiroDiaSemana
                    ?.message as string
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Planejamento de revisões
              </label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      className="flex-1 ui-input"
                      value={planInput}
                      onChange={(e) => setPlanInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addPlano}
                      className="ui-btn-ghost"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planejamentoValues.map((dia: number) => (
                      <span
                        key={dia}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                      >
                        {dia} dias
                        <button
                          type="button"
                          onClick={() => removePlano(dia)}
                          className="text-red-600 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-red-600">
                    {
                      profileForm.formState.errors.planejamentoRevisoes
                        ?.message as string
                    }
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold">
                  {(user.planejamentoRevisoes || []).join(", ")}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleProfileSubmit()}
                    className="ui-btn-primary"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      profileForm.reset();
                    }}
                    className="ui-btn-ghost"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="ui-btn-ghost"
                >
                  Editar dados
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <FormModal
        open={emailModal}
        onClose={() => setEmailModal(false)}
        title="Atualizar e-mail"
        onSubmit={(e) => {
          e.preventDefault();
          handleEmailSubmit(e);
        }}
        submitLabel="Salvar"
      >
        <div>
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
        <div>
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
        onSubmit={(e) => {
          e.preventDefault();
          handlePasswordSubmit(e);
        }}
        submitLabel="Salvar"
      >
        <div>
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
        <div>
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

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="rounded-lg bg-red-600 text-white px-4 py-3 shadow-lg border border-red-700">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
