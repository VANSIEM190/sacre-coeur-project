import { useState } from "react";
import type { ClassName, TeacherUser } from "@sacre-coeur/domain/types";
import { Loader2, Mail, Pencil, Trash2 } from "lucide-react";

interface TeacherListProps {
  teachers: TeacherUser[];
  classes: ClassName[];
  isLoading: boolean;
  error: boolean;
  busyTeacherId?: string;
  onCopyAccessId: (accessId: string) => void;
  onResendInvitation: (id: string) => void;
  onDelete: (teacher: TeacherUser) => void;
  onSaveClasses: (id: string, assignedclasses: string[]) => Promise<void>;
}

export function TeacherList({
  teachers,
  classes,
  isLoading,
  error,
  busyTeacherId,
  onCopyAccessId,
  onResendInvitation,
  onDelete,
  onSaveClasses,
}: TeacherListProps) {
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  if (isLoading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  if (error)
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
      >
        Impossible de charger les professeurs.
      </p>
    );
  if (!teachers.length)
    return (
      <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Aucun professeur enregistré.
      </p>
    );

  const startEditing = (teacher: TeacherUser) => {
    setEditingTeacher(teacher.id);
    setSelectedClasses(teacher.assignedclasses);
  };
  const saveClasses = async (teacherId: string) => {
    try {
      await onSaveClasses(teacherId, selectedClasses);
      setEditingTeacher(null);
    } catch {
      // The mutation reports its own error and leaves the editor open for retry.
    }
  };

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {teachers.map((teacher) => (
        <li key={teacher.id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-48">
              <p className="font-semibold">{teacher.fullName}</p>
              <p className="text-sm text-muted-foreground">{teacher.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {teacher.assignedclasses.length} classe(s) attribuée(s)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopyAccessId(teacher.teacherAccessId)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                Copier ID
              </button>
              <button
                type="button"
                disabled={busyTeacherId === teacher.id}
                onClick={() => onResendInvitation(teacher.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
              >
                <Mail className="size-4" /> Renvoyer l’invitation
              </button>
              <button
                type="button"
                onClick={() => startEditing(teacher)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Pencil className="size-4" /> Classes
              </button>
              <button
                type="button"
                onClick={() => onDelete(teacher)}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive"
              >
                <Trash2 className="size-4" /> Supprimer
              </button>
            </div>
          </div>
          {editingTeacher === teacher.id && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Classes attribuées — {teacher.fullName}
              </p>
              <div className="flex flex-wrap gap-2">
                {classes.map((schoolClass) => (
                  <label
                    key={schoolClass.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(schoolClass.id)}
                      onChange={() =>
                        setSelectedClasses((current) =>
                          current.includes(schoolClass.id)
                            ? current.filter((id) => id !== schoolClass.id)
                            : [...current, schoolClass.id],
                        )
                      }
                    />
                    {schoolClass.nom_classe}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyTeacherId === teacher.id}
                  onClick={() => void saveClasses(teacher.id)}
                  className="rounded-lg bg-sacred-red px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
