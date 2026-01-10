import { useState, useEffect } from "react";
import { X, Save, Check } from "lucide-react";
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
  const [scheduleMap, setScheduleMap] = useState<Record<number, number[]>>({});

  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<number, number[]> = {};

      for (let i = 0; i < 7; i++) initialMap[i] = [];

      currentSchedule.forEach((slot) => {
        if (!initialMap[slot.dia_semana]) initialMap[slot.dia_semana] = [];
        if (slot.tema) {
          initialMap[slot.dia_semana].push(slot.tema.id);
        }
      });

      setScheduleMap(initialMap);
    }
  }, [isOpen, currentSchedule]);

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

  const handleSave = () => {
    onSave(scheduleMap);
  };

  if (!isOpen) return null;

  const weekDays = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Editar Cronograma
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {weekDays.map((dayName, dayIndex) => (
              <div
                key={dayIndex}
                className="bg-slate-50/50 rounded-xl border border-slate-100 p-4"
              >
                <h3 className="font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex justify-between items-center">
                  {dayName}
                  <span className="text-xs font-normal text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                    {(scheduleMap[dayIndex] || []).length} selecionadas
                  </span>
                </h3>

                <div className="space-y-2">
                  {subjects.map((subject) => {
                    const isSelected = scheduleMap[dayIndex]?.includes(
                      subject.id
                    );
                    return (
                      <button
                        key={subject.id}
                        onClick={() => toggleSubject(dayIndex, subject.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between group
                          ${
                            isSelected
                              ? "bg-white shadow-sm ring-1 ring-indigo-100"
                              : "hover:bg-white hover:shadow-sm text-slate-500"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: subject.cor }}
                          />
                          <span className={isSelected ? "text-slate-800" : ""}>
                            {subject.tema}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
