interface SubjectStat {
  id: number;
  name: string;
  color: string;
  count: number;
  hours: string;
  reviewsCount: number;
}

interface SubjectsTableProps {
  data: SubjectStat[];
}

export function SubjectsTable({ data }: SubjectsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">
          Desempenho por Disciplina
        </h3>
      </div>
      <div className="overflow-x-auto">
        {data.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Nenhum estudo registrado no período selecionado.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Disciplina</th>
                <th className="px-6 py-3 text-center">Estudos</th>
                <th className="px-6 py-3 text-center">Tempo Total</th>
                <th className="px-6 py-3 text-center">Revisões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((subject) => (
                <tr key={subject.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">
                    {subject.count}
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">
                    {subject.hours}h
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">
                    {subject.reviewsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
