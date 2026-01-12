import { DiaSemana, Usuario } from "@/lib/auth";
import {
  AtSign,
  Calendar,
  KeyRound,
  ShieldCheck,
  Snowflake,
  User,
} from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface UserProfileProps {
  user: Usuario & {
    ofensiva?: {
      atual: number;
      ultimoDiaAtivo: string | null;
      bloqueiosRestantes: number;
    };
  };
  onEditEmail: () => void;
  onEditPassword: () => void;
}

const diaSemanaMap: Record<DiaSemana, string> = {
  Dom: "Domingo",
  Seg: "Segunda-feira",
  Ter: "Terça-feira",
  Qua: "Quarta-feira",
  Qui: "Quinta-feira",
  Sex: "Sexta-feira",
  Sab: "Sábado",
};

export function UserProfile({
  user,
  onEditEmail,
  onEditPassword,
}: UserProfileProps) {
  const streak = user.ofensiva?.atual ?? 0;
  const lastDate = user.ofensiva?.ultimoDiaAtivo
    ? new Date(user.ofensiva.ultimoDiaAtivo).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : "N/A";
  const availableBlocks = user.ofensiva?.bloqueiosRestantes ?? 0;

  return (
    <div className="space-y-8">
      {/* User stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Sequência de estudos"
          value={streak}
          subtitle={streak > 0 ? `Último registro: ${lastDate}` : "Nenhum dia"}
          icon={User}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Primeiro dia da semana"
          value={diaSemanaMap[user.primeiroDiaSemana!]}
          subtitle="Para o calendário"
          icon={Calendar}
          colorClass="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Bloqueios disponíveis"
          value={availableBlocks}
          subtitle="Para proteger sua ofensiva"
          icon={Snowflake}
          colorClass="bg-sky-100 text-sky-600"
        />
      </div>

      {/* Security management card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Segurança</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AtSign className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-700">E-mail</h3>
            </div>
            <p className="text-slate-500 text-sm mb-3">
              Seu e-mail atual é{" "}
              <span className="font-medium text-slate-600">{user.email}</span>.
            </p>
            <button
              onClick={onEditEmail}
              className="ui-btn-ghost"
            >
              Alterar e-mail
            </button>
          </div>

          {/* Senha section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-700">Senha</h3>
            </div>
            <p className="text-slate-500 text-sm mb-3">
              Altere sua senha de acesso periodicamente para maior segurança.
            </p>
            <button
              onClick={onEditPassword}
              className="ui-btn-ghost"
            >
              Alterar senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
