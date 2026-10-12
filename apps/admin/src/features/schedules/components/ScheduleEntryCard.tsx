import type { FormEvent } from "react";
import { Check, Edit3, Loader2, Trash2, X } from "lucide-react";
import type { ScheduleEntry, TeacherUser } from "@sacre-coeur/domain/types";
import type { ScheduleEditForm as FormState } from "../types/schedule-forms";

interface ScheduleEntryCardProps {
  entry: ScheduleEntry;
  isEditing: boolean;
  editForm: FormState;
  teachers: TeacherUser[];
  isSaving: boolean;
  isDeleting: boolean;
  onFormChange: (form: FormState) => void;
  onTeacherChange: (id: string) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function ScheduleEntryCard({
  entry,
  isEditing,
  editForm,
  teachers,
  isSaving,
  isDeleting,
  onFormChange,
  onTeacherChange,
  onEditStart,
  onEditCancel,
  onSubmit,
  onDelete,
}: ScheduleEntryCardProps) {
  if (isEditing)
    return (
      <form
        onSubmit={onSubmit}
        className="grid w-full items-end gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-5"
      >
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase opacity-50">
          Matière
          <input
            required
            value={editForm.subject}
            onChange={(event) =>
              onFormChange({ ...editForm, subject: event.target.value })
            }
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase opacity-50">
          Professeur
          <select
            required
            value={editForm.teacher_id}
            onChange={(event) => onTeacherChange(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
          >
            <option value="" disabled>
              Choisir
            </option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase opacity-50">
          Début
          <input
            type="time"
            required
            value={editForm.startTime}
            onChange={(event) =>
              onFormChange({ ...editForm, startTime: event.target.value })
            }
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase opacity-50">
          Fin
          <input
            type="time"
            required
            value={editForm.endTime}
            onChange={(event) =>
              onFormChange({ ...editForm, endTime: event.target.value })
            }
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase opacity-50">
          Local
          <input
            required
            value={editForm.room}
            onChange={(event) =>
              onFormChange({ ...editForm, room: event.target.value })
            }
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
          />
        </label>
        <div className="flex items-center justify-end gap-2 pt-1 sm:col-span-5">
          <button
            type="button"
            onClick={onEditCancel}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <X className="size-3" /> Annuler
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1 rounded-full bg-sacred-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
            Enregistrer
          </button>
        </div>
      </form>
    );
  return (
    <article className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="min-w-17.5 border-r border-border pr-4 text-center">
          <p className="text-xs font-semibold opacity-70">{entry.dayOfWeek}</p>
          <p className="mt-0.5 text-[11px] font-medium opacity-50">
            {entry.startTime} - {entry.endTime}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">{entry.subject}</p>
          <p className="text-xs opacity-60">
            Local : {entry.room}
            {entry.teacherName && ` · Prof : ${entry.teacherName}`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onEditStart}
          aria-label="Modifier la période"
          className="grid size-9 place-items-center rounded-full border border-border text-primary hover:bg-muted"
        >
          <Edit3 className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Supprimer la période"
          className="grid size-9 place-items-center rounded-full border border-border hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
