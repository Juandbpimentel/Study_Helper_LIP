"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search } from "lucide-react";

import { RegistroEstudo } from "@/types/types";
import { studyService } from "@/services/study-service";
import { RecordDetailsModal } from "@/components/records/RecordDetailsModal";
import { RegisterStudyModal } from "@/components/dashboard/RegisterStudyModal";
import { ToastBanner, ToastState } from "@/components/ui/ToastBanner";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { PeriodSelect } from "@/components/ui/PeriodSelect";

export default function RecordsPage() {
  const [records, setRecords] = useState<RegistroEstudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("records_page_size");
      return saved ? parseInt(saved, 10) : 12;
    } catch {
      return 12;
    }
  });

  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState("");

  // period filter: 'all' | '7' | '14' | '30' | '60' | '90' | 'custom'
  const [period, setPeriod] = useState<string>(() => {
    try {
      return localStorage.getItem("records_period") ?? "30";
    } catch {
      return "30";
    }
  });
  const [periodStart, setPeriodStart] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("records_period_start") ?? undefined;
    } catch {
      return undefined;
    }
  });
  const [periodEnd, setPeriodEnd] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("records_period_end") ?? undefined;
    } catch {
      return undefined;
    }
  });

  const [selectedRecord, setSelectedRecord] = useState<RegistroEstudo | null>(
    null
  );
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toast, setToast] = useState(
    null as null | { variant: string; message: string }
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await studyService.getAll();
      if (res.error) {
        setError(res.error);
        setRecords([]);
      } else {
        setRecords(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }

  // apply text search
  const filteredByText = records.filter((r) => {
    const text = `${r.conteudo_estudado} ${r.tema?.tema ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  // compute date range filter
  function computeRange() {
    if (period === "all") return null;
    if (period === "custom") {
      const s = periodStart ? new Date(periodStart) : undefined;
      const e = periodEnd ? new Date(periodEnd) : undefined;
      return { start: s, end: e };
    }
    const days = parseInt(period, 10);
    if (Number.isNaN(days)) return null;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    return { start, end };
  }

  const range = computeRange();

  const filtered = filteredByText.filter((r) => {
    if (!range) return true;
    const d = new Date(r.data_estudo);
    if (range.start && d < range.start) return false;
    if (range.end) {
      // include full day
      const endOfDay = new Date(range.end);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // persist page size
  useEffect(() => {
    try {
      localStorage.setItem("records_page_size", String(pageSize));
    } catch {
      // ignore
    }
  }, [pageSize]);

  useEffect(() => {
    try {
      localStorage.setItem("records_period", period);
      if (periodStart)
        localStorage.setItem("records_period_start", periodStart);
      else localStorage.removeItem("records_period_start");
      if (periodEnd) localStorage.setItem("records_period_end", periodEnd);
      else localStorage.removeItem("records_period_end");
    } catch {
      // ignore
    }
  }, [period, periodStart, periodEnd]);

  const openRecord = (r: RegistroEstudo) => {
    setSelectedRecord(r);
  };

  const closeRecordModal = () => {
    setSelectedRecord(null);
  };

  const onNewSuccess = async () => {
    setToast({ variant: "success", message: "Registro salvo com sucesso." });
    setIsNewModalOpen(false);
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {toast && (
        <ToastBanner
          toast={toast as ToastState}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Registros
            </h1>
            <p className="text-slate-500 mt-1">
              Histórico de estudos realizados
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-indigo-600 text-white flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-transform transform cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Novo
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-shrink-0 self-start sm:self-auto">
            <PeriodSelect
              value={period}
              startDate={periodStart}
              endDate={periodEnd}
              hideCustomInputs
              className="items-start"
              onChange={(v) => {
                setPeriod(v);
                if (v !== "custom") {
                  setPeriodStart(undefined);
                  setPeriodEnd(undefined);
                }
                setPage(1);
              }}
              onChangeRange={(s, e) => {
                setPeriodStart(s);
                setPeriodEnd(e);
                setPage(1);
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 w-full">
              <input
                placeholder="Pesquisar conteúdo ou disciplina"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setQuery(searchText);
                    setPage(1);
                  }
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all w-full min-w-0 bg-white text-slate-700"
              />
              <button
                onClick={() => {
                  setQuery(searchText);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-lg bg-indigo-50 text-indigo-600 flex items-center gap-2 shadow-sm hover:bg-indigo-100 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                title="Buscar"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="date"
              value={periodStart ?? ""}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <span className="text-slate-400 text-sm">até</span>
            <input
              type="date"
              value={periodEnd ?? ""}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Carregando...</div>
          ) : error ? (
            <div className="py-8 text-center text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              Nenhum registro encontrado.
            </div>
          ) : (
            <div className="space-y-2">
              {pageItems.map((r) => (
                <div
                  key={r.id}
                  onClick={() => openRecord(r)}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  <div className="truncate">
                    <div className="font-medium text-slate-800 truncate">
                      {r.conteudo_estudado}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {r.tema?.tema ?? "Geral"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {format(parseISO(r.data_estudo), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-slate-500">
                  {filtered.length} registro(s)
                </div>
                <div className="flex items-center gap-3">
                  <PageSizeSelect
                    value={pageSize}
                    onChange={(next) => {
                      setPageSize(next);
                      setPage(1);
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <div className="px-3 py-1 text-sm text-slate-600">
                      {page} / {totalPages}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <RecordDetailsModal record={selectedRecord} onClose={closeRecordModal} />
      <RegisterStudyModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={onNewSuccess}
      />
    </div>
  );
}
