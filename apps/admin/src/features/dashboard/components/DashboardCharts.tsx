import { PieChart as PieIcon, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardClassCount,
  DashboardStatusCount,
} from "../types/dashboard-metrics";

interface DashboardChartsProps {
  classDistribution: DashboardClassCount[];
  statusDistribution: DashboardStatusCount[];
  actorCount: number;
}

export function DashboardCharts({
  classDistribution,
  statusDistribution,
  actorCount,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
      <section className="flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 sm:col-span-2 sm:rounded-3xl sm:p-6">
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="size-4 text-sacred-red sm:size-5" />
            <h2 className="font-display text-base font-bold sm:text-lg">
              Répartition des effectifs
            </h2>
          </div>
          <p className="text-xs opacity-60">
            Nombre exact d'élèves physiques rattachés par classe.
          </p>
        </div>
        <div className="h-64 w-full min-w-0 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classDistribution}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#991b1b" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#991b1b" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.15}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "currentColor", opacity: 0.7, fontSize: 10 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "currentColor", opacity: 0.6, fontSize: 10 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(153, 27, 27, 0.05)" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="Élèves actifs"
                fill="url(#barColor)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="flex w-full flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:rounded-3xl sm:p-6">
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <PieIcon className="size-4 text-sacred-gold sm:size-5" />
            <h2 className="font-display text-base font-bold sm:text-lg">
              Statuts & Comptes
            </h2>
          </div>
          <p className="text-xs opacity-60">
            Équilibre global des acteurs de l'établissement.
          </p>
        </div>
        <div className="relative flex h-56 w-full items-center justify-center sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
              >
                {statusDistribution.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute text-center">
            <span className="font-display text-xl font-bold sm:text-2xl">
              {actorCount}
            </span>
            <p className="text-[9px] uppercase tracking-wider opacity-50 sm:text-[10px]">
              Acteurs
            </p>
          </div>
        </div>
        <div className="mt-2 space-y-2 sm:mt-4">
          {statusDistribution.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="max-w-30 truncate font-medium opacity-70 sm:max-w-none">
                  {item.name}
                </span>
              </div>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
