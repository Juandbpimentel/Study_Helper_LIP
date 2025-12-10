"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { authService, Usuario } from "@/lib/auth";

export default function DashboardPage() {
  const { user, setUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // fallback fetch if context not yet populated
    if (user) return;
    authService.getProfile().then((result) => {
      if (result.error) {
        setError(result.error);
        window.location.href = "/login";
      } else if (result.data) {
        setUser(result.data as Usuario);
      }
      setLoading(false);
    });
  }, [user, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="app-page-surface py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ui-card shadow-xl rounded-2xl p-6 sm:p-8 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] ui-text-muted">
                Painel
              </p>
              <h1 className="text-3xl font-semibold">Dashboard</h1>
            </div>
          </div>

          {user && (
            <div className="space-y-4">
              <div>
                <p className="text-sm ui-text-muted">Email</p>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              {user.nome && (
                <div>
                  <p className="text-sm ui-text-muted">Nome</p>
                  <p className="text-lg font-semibold">{user.nome}</p>
                </div>
              )}
              <div>
                <p className="text-sm ui-text-muted">ID (sub)</p>
                <p className="text-lg font-semibold">{user.id}</p>
              </div>
              <div>
                <p className="text-sm ui-text-muted">Primeiro dia da semana</p>
                <p className="text-lg font-semibold">
                  {user.primeiroDiaSemana ?? "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-sm ui-text-muted">
                  Planejamento de revisões
                </p>
                <p className="text-lg font-semibold">
                  {(Array.isArray(user.planejamentoRevisoes)
                    ? user.planejamentoRevisoes
                    : []
                  ).join(", ")}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 rounded-xl ui-badge-positive">
            <p className="text-sm">
              ✅ Você está autenticado via Cookie! O token é enviado
              automaticamente em todas as requisições.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
