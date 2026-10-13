import type { ClassName } from "@sacre-coeur/domain/types";

export function ScheduleClassGrid({
  classes,
  onSelect,
}: {
  classes: ClassName[];
  onSelect: (schoolClass: ClassName) => void;
}) {
  if (classes.length === 0) {
    return <p className="mt-6 rounded-2xl border border-dashed border-border py-12 text-center text-sm opacity-60">Aucune classe disponible.</p>;
  }
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((schoolClass) => (
        <button
          key={schoolClass.id}
          type="button"
          onClick={() => onSelect(schoolClass)}
          className="group cursor-pointer rounded-3xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <span className="mb-2 block font-display text-2xl">{schoolClass.nom_classe}</span>
          <span className="text-sm opacity-60">Consulter ou télécharger l'emploi du temps de cette classe.</span>
        </button>
      ))}
    </div>
  );
}
