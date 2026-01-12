"use client";

import { useEffect, useState, ComponentType } from "react";
import { format } from "date-fns";
import { Bell, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { notificationService } from "@/services/notification-service";
import { RevisaoNotification } from "@/types/types";

const typeStyles: Record<RevisaoNotification["tipo"], string> = {
  expirada: "border-red-200 bg-red-50 text-red-800",
  atrasada: "border-amber-200 bg-amber-50 text-amber-800",
  hoje: "border-indigo-200 bg-indigo-50 text-indigo-800",
  em_breve: "border-blue-200 bg-blue-50 text-blue-800",
};

const typeIcon: Record<RevisaoNotification["tipo"], ComponentType<any>> = {
  expirada: AlertTriangle,
  atrasada: AlertTriangle,
  hoje: CheckCircle2,
  em_breve: Clock3,
};

export default function NotificationsPage() {
  const [items, setItems] = useState<RevisaoNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService
      .getRevisionNotifications()
      .then((res) => setItems(res.data || []))
      .catch((err) => console.error("Erro ao carregar notificações", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700 shadow-sm">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notificações</h1>
            <p className="text-slate-500 text-sm">
              Revisões do dia, próximas e atrasadas.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
            Carregando notificações...
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <p className="text-slate-600 text-sm">
              Nenhuma notificação no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((n) => {
              const Icon = typeIcon[n.tipo];
              return (
                <div
                  key={`${n.revisaoId}-${n.tipo}-${n.dataRevisao}`}
                  className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 ${
                    typeStyles[n.tipo]
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white/60 text-inherit">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">
                      {n.mensagem}
                    </p>
                    <p className="text-xs opacity-80 mt-1">
                      {n.tema ? `Tema: ${n.tema} · ` : ""}
                      {format(new Date(n.dataRevisao), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
