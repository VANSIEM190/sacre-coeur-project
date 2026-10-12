import { Calendar, ChevronRight } from "lucide-react";
import type { Announcement } from "@sacre-coeur/domain/types";

interface DashboardActivityProps {
  announcements: Announcement[];
  pendingStudents: number;
  onValidate: () => void;
}

export function DashboardActivity({
  announcements,
  pendingStudents,
  onValidate,
}: DashboardActivityProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      <section className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:rounded-3xl sm:p-6">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold sm:text-xl">
              Dernières annonces
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 sm:text-xs">
              <Calendar className="size-3" /> Récentes
            </span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {announcements.length === 0 ? (
              <p className="py-6 text-center text-xs opacity-50 sm:text-sm">
                Aucune annonce publiée.
              </p>
            ) : (
              announcements.slice(0, 3).map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-border/50 bg-muted/40 p-3 sm:rounded-2xl sm:p-4"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-semibold sm:text-sm">
                      {item.title}
                    </p>
                    <span className="shrink-0 font-mono text-[9px] opacity-50 sm:text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed opacity-70">
                    {item.body}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
      <section className="group relative flex min-h-55 flex-col justify-between overflow-hidden rounded-2xl bg-sacred-red p-5 text-white sm:rounded-3xl sm:p-6">
        <div className="pointer-events-none absolute -bottom-10 -right-10 size-32 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:bg-white/10 sm:size-40" />
        <div className="relative z-10">
          <h2 className="mb-2 font-display text-lg font-bold sm:mb-4 sm:text-xl">
            Inscriptions en attente
          </h2>
          <p className="mb-2 font-display text-4xl font-black tracking-tight sm:text-6xl">
            {pendingStudents}
          </p>
          <p className="max-w-sm text-xs leading-relaxed opacity-90 sm:text-sm">
            Dossiers d'élèves en attente de vérification administrative pour
            validation définitive.
          </p>
        </div>
        <button
          onClick={onValidate}
          className="relative z-10 mt-6 flex w-full items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-xs font-semibold text-sacred-red shadow-lg transition-all hover:bg-white/90 active:scale-95 sm:w-auto sm:rounded-2xl sm:py-2.5 sm:text-sm"
        >
          Valider les dossiers
          <ChevronRight className="size-4" />
        </button>
      </section>
    </div>
  );
}
