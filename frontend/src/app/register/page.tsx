"use client";

import Link from "next/link";
import { useState } from "react";
import { authService } from "@/lib/auth";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (senha !== confirmacao) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);

    const result = await authService.register({ email, senha, nome });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="app-page-surface flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8 items-center">
        <div className="hero-block hidden lg:block space-y-4">
          <p className="ui-hero-badge hero-badge bg-white border-slate-200 text-slate-900 shadow-sm">
            Novo por aqui?
          </p>
          <h1 className="hero-text text-4xl font-semibold leading-tight opacity-100 mix-blend-normal">
            Comece a organizar seus estudos hoje mesmo.
          </h1>
          <p className="hero-text text-lg max-w-xl opacity-100 mix-blend-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.16)]">
            Crie sua conta para montar cronogramas, acompanhar revisões e manter
            o foco no que importa.
          </p>
          <div className="h-12 w-1 rounded-full bg-gradient-to-b from-amber-500 via-orange-500 to-yellow-400"></div>
        </div>

        <div className="ui-card-contrast">
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-700">
              Cadastro rápido
            </p>
            <h2 className="text-3xl font-semibold">Crie sua conta</h2>
            <p className="text-sm text-slate-600">Leva menos de um minuto.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
            {error && <div className="ui-alert-error">{error}</div>}

            <div className="space-y-2">
              <label
                htmlFor="nome"
                className="text-sm font-medium text-slate-700"
              >
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                className="ui-input"
                placeholder="Seu nome (opcional)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

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

            <div className="space-y-2">
              <label
                htmlFor="confirmacao"
                className="text-sm font-medium text-slate-700"
              >
                Confirmar senha
              </label>
              <input
                id="confirmacao"
                name="confirmacao"
                type="password"
                required
                className="ui-input"
                placeholder="Repita a senha"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="ui-btn-cta ui-btn-block">
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <p className="text-sm text-slate-600 text-center">
              Já possui conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-700 hover:text-amber-800"
              >
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
