"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  RotateCcw,
  BookOpen,
  BarChart3,
  GraduationCap,
  LogOut,
  FileText,
  User,
} from "lucide-react";
import { useAppContext } from "@/context/app-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      label: "Painel",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Calendário",
      href: "/calendar",
      icon: Calendar,
    },
    {
      label: "Revisões",
      href: "/reviews",
      icon: RotateCcw,
    },
    {
      label: "Disciplinas",
      href: "/subjects",
      icon: BookOpen,
    },
    {
      label: "Registros",
      href: "/records",
      icon: FileText,
    },
    {
      label: "Estatísticas",
      href: "/statistics",
      icon: BarChart3,
    },
  ];

  const userInitial = user?.nome ? user.nome[0].toUpperCase() : "U";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 flex flex-col z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900 leading-tight">
            StudyFlow
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gestão de Estudos
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto relative">
        {isMenuOpen && (
          <div className="absolute bottom-full left-0 w-[calc(100%-32px)] mx-4 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Link
              href="/profile"
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50"
            >
              <User className="w-4 h-4 text-slate-400" />
              Meu Perfil
            </Link>

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer text-left ${
            isMenuOpen ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">
              {user?.nome || "Carregando..."}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || "usuario@email.com"}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
