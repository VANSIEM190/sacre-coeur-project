import { Pencil, Trash2 } from "lucide-react";
import type { ClassName } from "@sacre-coeur/domain/types";

interface ClassGridProps {
  classes: ClassName[];
  isDeleting: boolean;
  onOpen: (schoolClass: ClassName) => void;
  onEdit: (schoolClass: ClassName) => void;
  onDelete: (schoolClass: ClassName) => void;
}

export function ClassGrid({ classes, isDeleting, onOpen, onEdit, onDelete }: ClassGridProps) {
  if (classes.length === 0) {
    return (
      <div className="col-span-full rounded-3xl border border-dashed border-border py-12 text-center opacity-60">
        <p className="text-sm">Aucune classe enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((schoolClass) => (
        <article key={schoolClass.id} className="group flex items-start justify-between rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
          <button type="button" onClick={() => onOpen(schoolClass)} className="text-left">
            <p className="mb-2 font-display text-2xl">{schoolClass.nom_classe}</p>
            <p className="text-sm opacity-60">
              {schoolClass.studentCount} élève{schoolClass.studentCount > 1 ? "s" : ""}
            </p>
          </button>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button type="button" onClick={() => onEdit(schoolClass)} aria-label={`Modifier ${schoolClass.nom_classe}`} className="grid size-8 place-items-center rounded-full border border-border transition-all hover:bg-muted">
              <Pencil className="size-4" />
            </button>
            <button type="button" disabled={isDeleting} onClick={() => onDelete(schoolClass)} aria-label={`Supprimer ${schoolClass.nom_classe}`} className="grid size-8 place-items-center rounded-full border border-border transition-all hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40">
              <Trash2 className="size-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
