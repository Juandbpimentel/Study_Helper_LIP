'use client';

import { useAppContext } from "@/context/app-context";
import Link from "next/link";

export default function Home() {
  const { user } = useAppContext();
  const isLoggedIn = Boolean(user);
  return (
    <div className="landing-page">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20 pt-16 sm:px-10 sm:pt-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            <span className="landing-badge">Study Helper</span>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Organize seus estudos com clareza e foque no que importa.
            </h1>
            <p className="landing-muted max-w-2xl text-lg">
              Cadastre revisões, acompanhe progresso e mantenha uma rotina
              consistente. Tudo em um painel simples, com tema claro/escuro e
              navegação rápida.
            </p>
            <div className="flex flex-wrap gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="ui-btn-cta">
                    Ir para dashboard
                  </Link>

                </>
              ) :
                (<>
                  <Link href="/login" className="ui-btn-cta">
                    Entrar
                  </Link>
                  <Link href="/register" className="ui-btn-secondary">
                    Criar conta
                  </Link>
                </>
                )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="landing-card-alt flex items-center gap-2 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="landing-muted">
                  Revisões planejadas semana a semana
                </span>
              </div>
              <div className="landing-card-alt flex items-center gap-2 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="landing-muted">
                  Visão clara das próximas tarefas
                </span>
              </div>
            </div>
          </div>
          <div className="landing-card p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-sm landing-muted">
              <span>Visão geral</span>
              <span>Esta semana</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["Hoje", "Amanhã", "Próximos 7 dias"].map((label, idx) => (
                <div key={label} className="landing-card-alt p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.08em] landing-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--landing-accent)]">
                    {idx === 0 ? "3" : idx === 1 ? "5" : "12"}
                  </p>
                  <p className="text-xs landing-muted">revisões</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {[
                "Resumos de Álgebra",
                "Flashcards de História",
                "Lista de Cálculo",
              ].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface-alt)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{item}</p>
                    <p className="text-xs landing-muted">
                      Entrega{" "}
                      {i === 0 ? "hoje" : i === 1 ? "amanhã" : "em 3 dias"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Em dia
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-alt)] p-8 shadow-inner shadow-slate-900/10 backdrop-blur lg:grid-cols-3">
          {[
            {
              title: "Planejamento visual",
              desc: "Monte cronogramas e acompanhe revisões com clareza, sem perder prazos.",
            },
            {
              title: "Modo claro/escuro",
              desc: "Tema que respeita sua preferência e reduz fadiga visual em sessões longas.",
            },
            {
              title: "Controle simples",
              desc: "Login, perfil e dashboard prontos para uso — apenas foque em estudar.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="landing-card p-6 shadow-sm shadow-slate-900/5"
            >
              <h3 className="text-lg font-semibold text-[color:var(--landing-accent)]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm landing-muted">{card.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
