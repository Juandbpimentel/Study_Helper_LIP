"use client";

import { X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export type ToastState = {
  message: string;
  variant: ToastVariant;
};

const variantStyles: Record<ToastVariant, { container: string; icon: string }> =
  {
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: "text-emerald-700",
    },
    error: {
      container: "bg-rose-50 border-rose-200 text-rose-900",
      icon: "text-rose-700",
    },
    info: {
      container: "bg-indigo-50 border-indigo-200 text-indigo-900",
      icon: "text-indigo-700",
    },
  };

export function ToastBanner({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  const styles = variantStyles[toast.variant];

  return (
    <div className="fixed top-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-md">
      <div
        role="status"
        className={`border rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3 ${styles.container}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium break-words">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-lg hover:bg-white/60 active:scale-95 transition-transform ${styles.icon}`}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
