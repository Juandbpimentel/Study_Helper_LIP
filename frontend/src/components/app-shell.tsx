"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAppContext } from "@/context/app-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, logout } = useAppContext();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const renderToggle = () => {
    if (!mounted) {
      // Render a stable placeholder to avoid hydration mismatch before client mounts.
      return (
        <div className="ui-toggle" aria-hidden="true">
          <span className="ui-toggle-thumb translate-x-0" />
        </div>
      );
    }

    const isDark = theme === "dark";
    return (
      <button
        onClick={toggleTheme}
        className="ui-toggle"
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      >
        <span
          className={`ui-toggle-thumb ${
            isDark ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    );
  };

  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  return (
    <div className="min-h-screen flex flex-col">
      {isAuthPage ? (
        <header className="ui-nav">
          <div className="ui-nav-container justify-between">
            <Link
              href="/dashboard"
              className="ui-brand"
              aria-label="Ir para a Dashboard"
            >
              <span className="ui-brand-accent">Study</span>
              <span className="text-sm sm:text-base font-extrabold tracking-tight">
                Helper
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {renderToggle()}
              <Link
                href="/login"
                className="h-10 px-4 ui-pill text-sm font-semibold whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="h-10 px-4 ui-pill text-sm font-semibold whitespace-nowrap"
              >
                Registrar
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <header className="ui-nav">
          <div className="ui-nav-container">
            <Link
              href="/dashboard"
              className="ui-brand"
              aria-label="Ir para a Dashboard"
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
              {renderToggle()}
              <button onClick={logout} className="h-10 px-3 ui-btn-danger">
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
