import { Download, Pencil, Trash2 } from "lucide-react";
import type { ClassName, Course } from "@sacre-coeur/domain/types";

interface CourseListProps {
  courses: Course[];
  classes: ClassName[];
  downloadingId: string | null;
  onDownload: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string, filePath: string) => void;
}

export function CourseList({
  courses,
  classes,
  downloadingId,
  onDownload,
  onEdit,
  onDelete,
}: CourseListProps) {
  if (courses.length === 0)
    return (
      <p className="py-6 text-center text-sm opacity-50">
        Aucun support de cours trouvé.
      </p>
    );
  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <div>
            <p className="font-semibold">{course.title}</p>
            <div className="text-xs opacity-60">
              {classes
                .filter((classe) => classe.id === course.class_id)
                .map((classe) => (
                  <span key={classe.id}>
                    {classe.nom_classe} · {course.description}
                  </span>
                ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(course)}
              disabled={downloadingId === course.id}
              className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-muted disabled:opacity-50"
              title="Télécharger"
            >
              <Download className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(course)}
              className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-muted"
              title="Modifier"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(course.id, course.pdfUrl)}
              className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-destructive hover:text-destructive-foreground"
              title="Supprimer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
