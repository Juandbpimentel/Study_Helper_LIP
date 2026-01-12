import React from "react";
import { X, BookOpen } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  onCompleteWithAutomaticRecord: () => void;
}

export function ConcludeReviewModal({
  isOpen,
  onClose,
  onRegister,
  onCompleteWithAutomaticRecord,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Concluir Revisão
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-700">
            O que você deseja fazer ao concluir esta revisão?
          </p>

          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  Registrar estudo
                </div>
                <div className="text-sm text-slate-500">
                  Abrir o formulário de registro já ligado a esta revisão para
                  adicionar detalhes do que você estudou.
                </div>
              </div>
              <button
                onClick={onRegister}
                className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-transform transform cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                Registrar
              </button>
            </li>

            <li className="flex items-start gap-3 pt-2 border-t border-slate-100">
              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  Concluir sem registro
                </div>
                <div className="text-sm text-slate-500">
                  Marcar como concluída e criar um registro automático simples
                  (sem precisar preencher o formulário).
                </div>
              </div>
              <button
                onClick={onCompleteWithAutomaticRecord}
                className="ml-2 bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-transform transform cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                Concluir
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
