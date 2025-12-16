"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService, Usuario } from "@/lib/auth";

interface AppContextValue {
  user: Usuario | null;
  setUser: (u: Usuario | null) => void;
  logout: (redirectToLogin?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    authService.getProfile().then((result) => {
      if (!mounted) return;

      if (result.error) {
        console.error("Erro ao buscar perfil do usuário:", result.error);
        if (result.statusCode === 401) {
          setUser(null);
        }
        return;
      }

      if (result.data) {
        setUser(result.data as Usuario);
      }
    });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  const logout = useCallback(async (redirectToLogin: boolean = true) => {
    await authService.logout();
    setUser(null);
    if (redirectToLogin) {
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, setUser, logout }),
    [user, logout]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext deve ser usado dentro de AppProvider");
  return ctx;
}
