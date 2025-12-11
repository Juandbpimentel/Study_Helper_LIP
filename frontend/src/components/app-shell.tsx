"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAppContext } from "@/context/app-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAppContext();
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const isHome = pathname === "/";
  const isLoggedIn = Boolean(user);
  const showGuestNav = !isLoggedIn || isAuthPage;

  return (
    <div className="min-h-screen flex flex-col">
      {showGuestNav ? (
        <header className="ui-nav">
          <div className="ui-nav-container justify-between">
            <Link
              href="/"
              className="ui-brand"
              aria-label="Ir para a página inicial"
            >
              <span className="ui-brand-accent">Study</span>
              <span className="text-sm sm:text-base font-extrabold tracking-tight">
                Helper
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="h-10 px-4 ui-pill-primary whitespace-nowrap"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="h-10 px-4 ui-pill-secondary whitespace-nowrap"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <header className="ui-nav">
          <div className="ui-nav-container">
            <Link
              href="/"
              className="ui-brand"
              aria-label="Ir para a página inicial"
            >
              <span className="ui-brand-accent">Study</span>
              <span className="text-sm sm:text-base font-extrabold tracking-tight">
                Helper
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 ui-nav-links">
              <Link href="/dashboard" className="hover:opacity-80">
                Dashboard
              </Link>
              <Link href="/profile" className="hover:opacity-80">
                Ver perfil
              </Link>
              <button
                onClick={() => logout(!isHome)}
                className="h-10 px-3 ui-btn-danger"
              >
                Sair
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
