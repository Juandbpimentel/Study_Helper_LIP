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

export type ThemeMode = "light" | "dark";

interface AppContextValue {
  user: Usuario | null;
  setUser: (u: Usuario | null) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", theme === "dark");
    root.classList.toggle("theme-light", theme === "light");
    // Optional: remove Tailwind dark class if present
    root.classList.remove("dark");
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

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

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, setUser, theme, toggleTheme, logout }),
    [user, theme, logout]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext deve ser usado dentro de AppProvider");
  return ctx;
}
