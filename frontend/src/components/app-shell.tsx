"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAppContext();
  const pathname = usePathname();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const isHome = pathname === "/";
  const isProtectedRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/profile");

  const isLoggedIn = Boolean(user);
  const showDashboardLayout = isLoggedIn && !isHome && !isAuthPage;

  useEffect(() => {
    if (user) {
      setIsCheckingAuth(false);
    } else {
      const timer = setTimeout(() => setIsCheckingAuth(false), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);
  if (isProtectedRoute && !user && isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (showDashboardLayout) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Sidebar />
        <main className="ml-64 min-h-screen transition-all duration-300">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-100 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-indigo-600 font-bold text-xl">Study</span>
            <span className="text-slate-900 font-extrabold text-xl tracking-tight">
              Helper
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="h-10 px-5 rounded-full bg-indigo-600 text-white font-medium text-sm flex items-center hover:bg-indigo-700 transition-colors"
              >
                Ir para o Painel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-10 px-5 rounded-full text-slate-600 font-medium text-sm flex items-center hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="h-10 px-5 rounded-full bg-indigo-600 text-white font-medium text-sm flex items-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
