import { format, addDays, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

const isHex = (color: string) => color.startsWith("#");

const SubjectBadge = ({ name, color }: { name: string; color: string }) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    red: "bg-red-100 text-red-700 border-red-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };

  if (isHex(color)) {
    return (
      <span
        className="text-xs px-2.5 py-1 rounded-md border font-medium truncate w-full block text-center"
        style={{
          backgroundColor: `${color}20`,
          color: color,
          borderColor: `${color}40`,
        }}
      >
        {name}
      </span>
    );
  }

  const style =
    colorMap[color] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-md border font-medium truncate w-full block text-center ${style}`}
    >
      {name}
    </span>
  );
};

interface ScheduleItem {
  day: number;
  subjects: { name: string; color: string }[];
}

export function WeeklySchedule({
  scheduleData,
}: {
  scheduleData: ScheduleItem[];
}) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Cronograma Semanal</h2>
        </div>
        <button className="text-sm text-slate-500 hover:text-indigo-600 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
          Editar
        </button>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-7 gap-2 min-w-[800px]">
          {weekDays.map((day, idx) => {
            const daySchedule = scheduleData.find((s) => s.day === idx);
            const isCurrentDay = isSameDay(day, today);

            return (
              <div
                key={idx}
                className={`flex flex-col gap-2 p-2 rounded-xl min-h-[140px] transition-colors ${
                  isCurrentDay
                    ? "bg-indigo-50/50 ring-1 ring-indigo-100"
                    : "bg-slate-50/50"
                }`}
              >
                <span
                  className={`text-xs text-center font-medium mb-1 capitalize ${
                    isCurrentDay ? "text-indigo-600" : "text-slate-400"
                  }`}
                >
                  {format(day, "EEE", { locale: ptBR }).replace(".", "")}
                  {isCurrentDay && <span className="ml-1">•</span>}
                </span>

                <div className="space-y-1.5">
                  {daySchedule?.subjects.map((subj, i) => (
                    <SubjectBadge key={i} name={subj.name} color={subj.color} />
                  )) || (
                    <span className="text-[10px] text-slate-300 text-center block mt-4 select-none">
                      -
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
