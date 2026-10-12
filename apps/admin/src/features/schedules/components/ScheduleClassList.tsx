import type { ClassName } from "@sacre-coeur/domain/types";

interface ScheduleClassListProps {
  classes: ClassName[];
  onSelect: (classe: ClassName) => void;
}

export function ScheduleClassList({
  classes,
  onSelect,
}: ScheduleClassListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((classe) => (
        <button
          key={classe.id}
          type="button"
          onClick={() => onSelect(classe)}
          className="group cursor-pointer rounded-3xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="mb-2 font-display text-2xl">{classe.nom_classe}</p>
          <p className="text-sm opacity-60">
            Cliquez pour gérer ou télécharger l'emploi du temps.
          </p>
        </button>
      ))}
    </div>
  );
}
