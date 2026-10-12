import { useState, type FormEvent } from "react";
import type { ClassName } from "@sacre-coeur/domain/types";
import type { RegisterTeacherInput } from "@sacre-coeur/data-access/services/teacher/teacher.service";
import { Loader2, Plus } from "lucide-react";

interface TeacherFormProps {
  classes: ClassName[];
  isLoadingClasses: boolean;
  classesError: boolean;
  isSubmitting: boolean;
  onSubmit: (values: RegisterTeacherInput) => void;
}

export function TeacherForm({
  classes,
  isLoadingClasses,
  classesError,
  isSubmitting,
  onSubmit,
}: TeacherFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [assignedclasses, setAssignedClasses] = useState<string[]>([]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ fullName, email, assignedclasses });
  };

  const toggleClass = (classId: string) =>
    setAssignedClasses((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    );

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div>
        <h2 className="font-display text-xl font-bold">Créer un professeur</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Un lien d’activation sera envoyé à son adresse e-mail.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Nom complet
          <input
            required
            maxLength={80}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="name"
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            autoComplete="email"
          />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Classes attribuées</legend>
        {isLoadingClasses ? (
          <p className="text-sm text-muted-foreground">
            Chargement des classes depuis Supabase…
          </p>
        ) : null}
        {classesError ? (
          <p role="alert" className="text-sm text-destructive">
            Impossible de charger les classes. Réessayez avant de créer le
            compte.
          </p>
        ) : null}
        {!isLoadingClasses && !classesError && classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune classe n’est enregistrée.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {classes.map((schoolClass) => (
            <label
              key={schoolClass.id}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={assignedclasses.includes(schoolClass.id)}
                onChange={() => toggleClass(schoolClass.id)}
              />
              {schoolClass.nom_classe}
            </label>
          ))}
        </div>
        {classes.length > 0 && assignedclasses.length === 0 && (
          <p className="text-sm text-destructive">
            Sélectionnez au moins une classe.
          </p>
        )}
      </fieldset>
      <button
        type="submit"
        disabled={
          isSubmitting ||
          isLoadingClasses ||
          classesError ||
          classes.length === 0 ||
          assignedclasses.length === 0
        }
        className="inline-flex items-center gap-2 rounded-lg bg-sacred-red px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Créer le compte
      </button>
    </form>
  );
}
