import { useState } from "react";
import { X, Save, Square, CheckSquare, Loader2 } from "lucide-react";
import { TemaDeEstudo, SlotCronograma } from "@/types/types";

interface ScheduleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: TemaDeEstudo[];
  currentSchedule: SlotCronograma[];
  onSave: (scheduleMap: Record<number, number[]>) => void;
}

export function ScheduleEditor({
  isOpen,
  onClose,
  subjects,
  currentSchedule,
  onSave,
}: ScheduleEditorProps) {
  // Monta/desmonta o editor quando abre/fecha.
  // Assim o estado inicial deriva de currentSchedule sem usar useEffect.
  if (!isOpen) return null;
  return (
    <ScheduleEditorInner
      isOpen={isOpen}
      onClose={onClose}
      subjects={subjects}
      currentSchedule={currentSchedule}
      onSave={onSave}
    />
  );
}

type ScheduleMap = Record<number, number[]>;

function buildInitialScheduleMap(
  currentSchedule: SlotCronograma[]
): ScheduleMap {
  const initialMap: ScheduleMap = {};
  for (let i = 0; i < 7; i++) initialMap[i] = [];

  currentSchedule.forEach((slot) => {
    const temaId = slot.tema?.id ?? slot.tema_id;
    if (!temaId) return;

    if (!initialMap[slot.dia_semana]) initialMap[slot.dia_semana] = [];
    if (!initialMap[slot.dia_semana].includes(temaId)) {
      initialMap[slot.dia_semana].push(temaId);
    }
  });

  return initialMap;
}

function ScheduleEditorInner({
  onClose,
  subjects,
  currentSchedule,
  onSave,
}: ScheduleEditorProps) {
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>(() =>
    buildInitialScheduleMap(currentSchedule)
  );
  const [isSaving, setIsSaving] = useState(false);
  const toggleSubject = (day: number, subjectId: number) => {
    setScheduleMap((prev) => {
      const currentDaySubjects = prev[day] || [];
      const exists = currentDaySubjects.includes(subjectId);

      let newDaySubjects;
      if (exists) {
        newDaySubjects = currentDaySubjects.filter((id) => id !== subjectId);
      } else {
        newDaySubjects = [...currentDaySubjects, subjectId];
      }
      return { ...prev, [day]: newDaySubjects };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(scheduleMap);
    setIsSaving(false);
  };

  const weekDays = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Editar Cronograma Semanal
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          <div className="space-y-10">
            {weekDays.map((dayName, dayIndex) => (
              <div
                key={dayIndex}
                className="animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${dayIndex * 50}ms` }}
              >
                <h3 className="font-semibold text-slate-800 mb-4 text-base">
                  {dayName}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => {
                    const isSelected = scheduleMap[dayIndex]?.includes(
                      subject.id
                    );
                    return (
                      <button
                        key={subject.id}
                        onClick={() => toggleSubject(dayIndex, subject.id)}
                        className={`
                          group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left w-full transform active:scale-95 cursor-pointer
                          ${
                            isSelected
                              ? "bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-200"
                              : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                          }
                        `}
                      >
                        <div
                          className={`shrink-0 transition-colors duration-200 ${
                            isSelected
                              ? "text-indigo-600"
                              : "text-slate-300 group-hover:text-indigo-300"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare
                              className="w-6 h-6 fill-indigo-50"
                              strokeWidth={2}
                            />
                          ) : (
                            <Square className="w-6 h-6" strokeWidth={1.5} />
                          )}
                        </div>

                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: subject.cor }}
                          />
                          <span
                            className={`text-sm font-medium truncate ${
                              isSelected ? "text-slate-900" : "text-slate-600"
                            }`}
                          >
                            {subject.tema}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all transform active:scale-[0.98] cursor-pointer"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform flex items-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
