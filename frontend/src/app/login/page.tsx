"use client";

import Link from "next/link";
import { useState } from "react";
import { authService } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authService.login({ email, senha });

    if (result.error) {
      setError(result.error);
    } else {
      window.location.href = "/dashboard";
    }

    setLoading(false);
  };

  return (
    <div className="app-page-surface flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8 items-center">
        <div className="hero-block hidden lg:block space-y-4">
          <p className="ui-hero-badge hero-badge bg-white border-slate-200 shadow-sm dark:bg-slate-900/70 dark:border-slate-800">
            Study Helper
          </p>
          <h1 className="hero-text text-4xl font-semibold leading-tight opacity-100 mix-blend-normal">
            Planeje, execute e acompanhe seus estudos com clareza.
          </h1>
          <p className="hero-text text-lg max-w-xl opacity-100 mix-blend-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]">
            Centralize cronogramas, revisões e sessões de estudo em um painel
            único. Entre para continuar sua rotina.
          </p>
          <div className="h-12 w-1 rounded-full bg-gradient-to-b from-cyan-500 via-emerald-500 to-lime-400"></div>
        </div>

        <div className="ui-card-contrast">
          <div className="space-y-2">
            <p className="text-sm font-medium text-cyan-700">
              Bem-vindo de volta
            </p>
            <h2 className="text-3xl font-semibold">Acesse sua conta</h2>
            <p className="text-sm text-slate-600">
              Use o email cadastrado para continuar gerenciando seus estudos.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            {error && <div className="ui-alert-error">{error}</div>}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="ui-input"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="senha"
                className="text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                className="ui-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="ui-btn-cta">
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-sm text-slate-600 text-center">
              Ainda não tem conta?{" "}
              <Link href="/register" className="ui-link-accent">
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
