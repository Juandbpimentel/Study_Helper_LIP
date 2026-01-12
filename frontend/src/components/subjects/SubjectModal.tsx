"use client";

import { FormEvent, useEffect, useState } from "react";
import { Palette } from "lucide-react";

import { TemaDeEstudo } from "@/types/types";
import { BaseModal } from "@/components/base-modal";

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: number;
    tema: string;
    cor: string;
  }) => void;
  subject?: TemaDeEstudo | null;
  isSubmitting?: boolean;
}

const defaultColor = "#6366f1";

export function SubjectModal({
  isOpen,
  onClose,
  onSubmit,
  subject,
  isSubmitting = false,
}: SubjectModalProps) {
  const [tema, setTema] = useState("");
  const [cor, setCor] = useState(defaultColor);

  useEffect(() => {
    if (isOpen) {
      if (subject) {
        setTema(subject.tema);
        setCor(subject.cor || defaultColor);
      } else {
        setTema("");
        setCor(defaultColor);
      }
    }
  }, [isOpen, subject]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || isSubmitting) return;

    onSubmit({
      ...(subject && { id: subject.id }),
      tema,
      cor,
    });
  };

  const title = subject ? "Editar Disciplina" : "Nova Disciplina";

  return (
    <BaseModal open={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input para nome do tema */}
        <div className="space-y-2">
          <label htmlFor="tema" className="text-sm font-medium text-slate-700">
            Nome da Disciplina
          </label>
          <input
            id="tema"
            type="text"
            placeholder="Ex: Cálculo I"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Input para cor */}
        <div className="space-y-2">
          <label htmlFor="cor" className="text-sm font-medium text-slate-700">
            Cor de Identificação
          </label>
          <div className="relative w-full">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <input
                  id="cor"
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="h-11 w-11 p-1 rounded-lg border border-slate-200 cursor-pointer shadow-sm appearance-none"
                />
                <Palette className="w-4 h-4 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference text-white" />
              </div>
              <div className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-mono text-sm">
                {cor.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!tema.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50"
          >
            {isSubmitting
              ? "Salvando..."
              : subject
              ? "Salvar Alterações"
              : "Criar Disciplina"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
