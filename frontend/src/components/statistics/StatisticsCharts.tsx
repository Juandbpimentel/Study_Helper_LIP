import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Award } from "lucide-react";

interface StatisticsChartsProps {
  dailyData: any[];
  studyBySubject: any[];
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
];

export function StatisticsCharts({
  dailyData,
  studyBySubject,
}: StatisticsChartsProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">
            Tempo de Estudo Diário
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                unit="min"
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number | undefined) => [
                  `${value} min`,
                  "Tempo",
                ]}
                labelStyle={{ color: "#1e293b", fontWeight: 600 }}
              />
              <Bar
                dataKey="estudos"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Tempo por Disciplina</h3>
        </div>
        <div className="h-64">
          {studyBySubject.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studyBySubject}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="minutes"
                >
                  {studyBySubject.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value, name, props: any) => [
                    `${props.payload.hours}h`,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {studyBySubject.slice(0, 5).map((subject, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    subject.color || COLORS[index % COLORS.length],
                }}
              />
              <span className="text-slate-600 font-medium">{subject.name}</span>
              <span className="text-slate-400">({subject.hours}h)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
