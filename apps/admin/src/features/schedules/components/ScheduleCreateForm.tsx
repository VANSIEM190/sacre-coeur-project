import type { FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import type {
  ClassName,
  TeacherUser,
  ScheduleEntry,
} from "@sacre-coeur/domain/types";
import type { ScheduleCreateForm as FormState } from "../types/schedule-forms";
import { SCHEDULE_DAYS } from "../types/schedule-forms";

interface ScheduleCreateFormProps {
  classes: ClassName[];
  teachers: TeacherUser[];
  form: FormState;
  isSaving: boolean;
  onFormChange: (form: FormState) => void;
  onTeacherChange: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ScheduleCreateForm({
  classes,
  teachers,
  form,
  isSaving,
  onFormChange,
  onTeacherChange,
  onSubmit,
}: ScheduleCreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-8 grid gap-3 rounded-3xl border border-border bg-card p-6 sm:grid-cols-3"
    >
      <h2 className="mb-1 font-display text-xl sm:col-span-3">
        Ajouter une période de cours
      </h2>
      <select
        value={form.classe_id}
        onChange={(event) =>
          onFormChange({
            ...form,
            classe_id: event.target.value,
            teacher_id: "",
            teacherName: "",
          })
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      >
        <option value="" disabled>
          Choisir la classe cible
        </option>
        {classes.map((classe) => (
          <option key={classe.id} value={classe.id}>
            {classe.nom_classe}
          </option>
        ))}
      </select>
      <select
        value={form.dayOfWeek}
        onChange={(event) =>
          onFormChange({
            ...form,
            dayOfWeek: event.target.value as ScheduleEntry["dayOfWeek"],
          })
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      >
        {SCHEDULE_DAYS.map((day) => (
          <option key={day}>{day}</option>
        ))}
      </select>
      <input
        required
        placeholder="Matière"
        value={form.subject}
        onChange={(event) =>
          onFormChange({ ...form, subject: event.target.value })
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      />
      <select
        required
        value={form.teacher_id}
        onChange={(event) => onTeacherChange(event.target.value)}
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      >
        <option value="" disabled>
          Choisir l'enseignant
        </option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.fullName}
          </option>
        ))}
      </select>
      <input
        type="time"
        value={form.startTime}
        onChange={(event) =>
          onFormChange({ ...form, startTime: event.target.value })
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      />
      <input
        type="time"
        value={form.endTime}
        onChange={(event) =>
          onFormChange({ ...form, endTime: event.target.value })
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      />
      <input
        required
        placeholder="Local / Salle"
        value={form.room}
        onChange={(event) =>
          onFormChange({ ...form, room: event.target.value })
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
      />
      <button
        disabled={isSaving}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-sacred-red font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:col-span-3"
      >
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Ajouter à l'emploi du temps
      </button>
    </form>
  );
}
