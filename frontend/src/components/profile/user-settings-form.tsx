import { DiaSemana, Usuario } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  nome: z.string().min(2, "O nome deve ter ao menos 2 caracteres"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserSettingsFormProps {
  user: Usuario;
  onSubmit: (data: ProfileFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function UserSettingsForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: user.nome,
    },
  });

  useEffect(() => {
    reset({
      nome: user.nome,
    });
  }, [user, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6 animate-in fade-in"
    >
      <div className="space-y-2">
        <label htmlFor="nome" className="text-sm font-medium text-slate-700">
          Nome de usuário
        </label>
        <input
          id="nome"
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
          {...register("nome")}
        />
        {errors.nome && (
          <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
