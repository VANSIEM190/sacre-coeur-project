import { BookOpen, GraduationCap, Megaphone, Users } from "lucide-react";

interface DashboardStatsProps {
  students: number;
  teachers: number;
  classes: number;
  announcements: number;
}

export function DashboardStats({
  students,
  teachers,
  classes,
  announcements,
}: DashboardStatsProps) {
  const stats = [
    {
      icon: Users,
      label: "Élèves inscrits",
      value: students,
      color: "bg-sacred-red/10 text-sacred-red",
    },
    {
      icon: GraduationCap,
      label: "Enseignants activés",
      value: teachers,
      color: "bg-sacred-gold/20 text-sacred-gold",
    },
    {
      icon: BookOpen,
      label: "Classes actives",
      value: classes,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: Megaphone,
      label: "Annonces actives",
      value: announcements,
      color: "bg-emerald-500/10 text-emerald-600",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-md sm:rounded-3xl sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-12 sm:rounded-2xl ${stat.color}`}
            >
              <stat.icon className="size-5 sm:size-6" />
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 sm:text-xs">
              Live DB
            </span>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs font-medium opacity-60 sm:text-sm">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
