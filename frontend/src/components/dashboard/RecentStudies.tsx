import { BookOpen } from "lucide-react";
import { RegistroEstudo } from "@/types/types";

interface RecentStudiesProps {
  studies: RegistroEstudo[];
}

export function RecentStudies({ studies }: RecentStudiesProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-800">Estudos Recentes</h3>
      </div>

      <div className="space-y-4">
        {studies.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhum estudo registrado recentemente.
          </p>
        ) : (
          studies.map((study) => (
            <div
              key={study.id}
              className="flex justify-between items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0 hover:bg-slate-50/50 transition-colors rounded-lg px-1 -mx-1"
            >
              <div className="overflow-hidden mr-4">
                <p
                  className="font-medium text-slate-800 text-sm truncate"
                  title={study.conteudo_estudado}
                >
                  {study.conteudo_estudado}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {study.tema?.tema || "Geral"}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-100 px-2 py-1 rounded-full">
                {study.tempo_dedicado} min
              </span>
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-6 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors border-t border-transparent hover:border-slate-100 pt-2">
        Ver todo o histórico
      </button>
    </div>
  );
}
