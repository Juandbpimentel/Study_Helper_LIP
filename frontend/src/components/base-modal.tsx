"use client";

import { ReactNode } from "react";
import { useAppContext } from "@/context/app-context";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function BaseModal({
  open,
  onClose,
  title,
  children,
  footer,
}: BaseModalProps) {
  const { theme } = useAppContext();
  const isDark = theme === "dark";
  const overlayClass = isDark
    ? "absolute inset-0 bg-black/70 backdrop-blur-sm"
    : "absolute inset-0 bg-white/80 backdrop-blur-sm";
  const cardClass = isDark
    ? "bg-slate-900 text-slate-100 border border-slate-800"
    : "bg-white text-gray-900 border border-gray-200";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={overlayClass} />
      <div
        className="relative z-10 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${cardClass} rounded-xl shadow-xl p-6`}>
          {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
