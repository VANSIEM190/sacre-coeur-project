import { GraduationCap, Eye, Pencil, Trash2 } from "lucide-react";
import type { ClassName, EleveDetails } from "@sacre-coeur/domain/types";

interface ChildrenListProps {
  children: EleveDetails[];
  classes: ClassName[];
  isDeleting: boolean;
  onSelect: (student: EleveDetails) => void;
  onEdit: (student: EleveDetails) => void;
  onDelete: (studentId: string) => void;
}

export function ChildrenList({
  children,
  classes,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
}: ChildrenListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {children.map((child) => {
        const currentClass = classes.find(
          (classe) => classe.id === child.currentClassName,
        );
        return (
          <article
            key={child.id}
            className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 transition-all hover:shadow-lg"
          >
            <div className="space-y-1">
              <p className="font-display text-xl text-foreground">
                {child.firstName} {child.middleName} {child.lastName}
              </p>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <GraduationCap className="size-3.5" />
                <span>
                  Classe :{" "}
                  {currentClass
                    ? currentClass.nom_classe
                    : child.currentClassName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(child)}
                className="rounded-xl bg-muted/40 p-2.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                title="Voir le profil"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(child)}
                className="rounded-xl bg-muted/40 p-2.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                title="Modifier"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(child.id)}
                disabled={isDeleting}
                className="rounded-xl bg-destructive/10 p-2.5 text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
