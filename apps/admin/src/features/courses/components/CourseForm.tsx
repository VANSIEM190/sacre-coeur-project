import type { RefObject, FormEvent } from "react";
import { Plus, X } from "lucide-react";
import type { ClassName, Course } from "@sacre-coeur/domain/types";

interface CourseFormProps {
  classes: ClassName[];
  editingCourse: Course | null;
  title: string;
  description: string;
  classId: string;
  isSubmitting: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CourseForm({
  classes,
  editingCourse,
  title,
  description,
  classId,
  isSubmitting,
  fileInputRef,
  onTitleChange,
  onDescriptionChange,
  onClassChange,
  onFileChange,
  onReset,
  onSubmit,
}: CourseFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-8 space-y-3 rounded-3xl border border-border bg-card p-6"
    >
      {editingCourse && (
        <div className="mb-1 flex items-center justify-between text-xs opacity-60">
          <span>Modification de « {editingCourse.title} »</span>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 underline"
          >
            <X className="size-3" /> Annuler
          </button>
        </div>
      )}
      <input
        required
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Titre du cours"
        className="w-full rounded-xl border border-border bg-background px-4 py-3"
      />
      <textarea
        required
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3"
      />
      <div className="flex items-center gap-2">
        <select
          required
          value={classId}
          onChange={(event) => onClassChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3"
        >
          <option value="" disabled>
            Choisir une classe
          </option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom_classe}
            </option>
          ))}
        </select>
        <input
          type="file"
          ref={fileInputRef}
          required={!editingCourse}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          className="w-full cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none file:mr-4 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted/80"
        />
      </div>
      {editingCourse && (
        <p className="text-xs opacity-50">
          Laissez le champ fichier vide pour conserver le fichier actuel.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-full bg-sacred-red px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        <Plus className="size-4" />
        {isSubmitting
          ? "Enregistrement..."
          : editingCourse
            ? "Mettre à jour"
            : "Publier"}
      </button>
    </form>
  );
}
