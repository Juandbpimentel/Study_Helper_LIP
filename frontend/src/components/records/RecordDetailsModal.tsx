"use client";

import React, { useEffect, useState } from "react";
import { X, BookOpen, Loader2 } from "lucide-react";
import { RegistroEstudo, Revisao, SlotCronograma } from "@/types/types";
import { studyService } from "@/services/study-service";
import { formatDateTimePt, formatDatePt } from "@/lib/formatters";

export function RecordDetailsModal({
  record,
  onClose,
}: {
  record: RegistroEstudo | null;
  onClose: () => void;
}) {
  const [full, setFull] = useState<RegistroEstudo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!record) return;
    let mounted = true;
    setError(null);
    setFull(null);
    Promise.resolve().then(() => mounted && setLoading(true));

    (async () => {
      try {
        const res = await studyService.getById(record.id);
        if (!mounted) return;
        if (res.error) setError(res.error);
        else setFull(res.data || null);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Erro ao carregar detalhes do registro.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [record]);

  if (!record) return null;

  const data = full ?? record;

  const date = data.data_estudo ? new Date(data.data_estudo) : null;
  const dateLabel = formatDateTimePt(date);
  const tipoLabel = (t: string) => {
    if (t === "EstudoDeTema") return "Estudo (Cronograma)";
    if (t === "EstudoAberto") return "Estudo Aberto";
    if (t === "Revisao") return "Revisão";
    return t;
  };

  const slot = data.slotCronograma as SlotCronograma | undefined;
  const revisao = data.revisaoConcluida as Revisao | undefined;

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">
              Detalhes do Registro
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="py-4 text-rose-600">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Tema</div>
                  <div className="font-medium text-slate-800">
                    {data.tema?.tema ?? "Geral"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Tipo</div>
                  <div className="font-medium text-slate-800">
                    {tipoLabel(data.tipo_registro)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Data e Hora</div>
                <div className="font-medium text-slate-800">{dateLabel}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Conteúdo</div>
                <div className="font-medium text-slate-800">
                  {data.conteudo_estudado}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Tempo</div>
                  <div className="font-medium text-slate-800">
                    {data.tempo_dedicado} min
                  </div>
                </div>

                {slot ? (
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Slot</div>
                    <div className="font-medium text-slate-800">
                      {weekDays[slot.dia_semana] || "Dia"} • #{slot.ordem + 1} •{" "}
                      {slot.tema?.tema || "Disciplina"}
                    </div>
                  </div>
                ) : typeof data.slot_id === "number" && data.slot_id > 0 ? (
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Slot</div>
                    <div className="font-medium text-slate-800">
                      #{data.slot_id}
                    </div>
                  </div>
                ) : null}
              </div>

              {revisao ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">
                    Revisão Concluída
                  </div>
                  <div className="font-medium text-slate-800">
                    Programada para {formatDatePt(revisao.data_revisao)}
                  </div>
                  {revisao.registro_origem && (
                    <div className="text-sm text-slate-600 mt-2">
                      Origem:{" "}
                      {revisao.registro_origem.conteudo_estudado ||
                        `#${revisao.registro_origem.id}`}
                    </div>
                  )}
                </div>
              ) : null}

              {data.revisoesGeradas && data.revisoesGeradas.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500">Revisões Geradas</div>
                  <div className="mt-2 space-y-2">
                    {data.revisoesGeradas.map((rg) => (
                      <div
                        key={rg.id}
                        className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                      >
                        {formatDatePt(rg.data_revisao)} • {rg.status_revisao}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.anotacoes && (
                <div>
                  <div className="text-xs text-slate-500">Anotações</div>
                  <div className="font-medium whitespace-pre-wrap text-slate-800">
                    {data.anotacoes}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
