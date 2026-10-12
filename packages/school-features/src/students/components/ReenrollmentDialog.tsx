import { useId, type FormEvent } from "react";
import { Loader2, Lock, X } from "lucide-react";
import type { ClassName } from "@sacre-coeur/domain/types";
import type { useStudentProfile } from "../hooks/useStudentProfile";

type StudentProfileState = ReturnType<typeof useStudentProfile>;

type ReenrollmentDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSchoolYear: string;
  isLoadingEligibility: boolean;
  isReenrollmentOpen: boolean;
  eligibleClasses: ClassName[];
  selectedClassId: string;
  onSelectedClassChange: (classId: string) => void;
  feedbackMessage: StudentProfileState["feedbackMessage"];
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ReenrollmentDialog({
  isOpen,
  onOpenChange,
  currentSchoolYear,
  isLoadingEligibility,
  isReenrollmentOpen,
  eligibleClasses,
  selectedClassId,
  onSelectedClassChange,
  feedbackMessage,
  isSubmitting,
  onSubmit,
}: ReenrollmentDialogProps) {
  const classSelectId = useId();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reenrollment-dialog-title"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 relative"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Fermer"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="pr-8">
          <h3
            id="reenrollment-dialog-title"
            className="font-display text-lg sm:text-xl font-bold"
          >
            Réinscription scolaire
          </h3>
          <p className="text-sm opacity-60 mt-1">
            Année académique : {currentSchoolYear}
          </p>
        </div>

        {isLoadingEligibility ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-sacred-red" />
          </div>
        ) : !isReenrollmentOpen ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-600">
            <Lock className="size-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              Les réinscriptions ne sont pas encore ouvertes par
              l'administration.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {feedbackMessage && (
              <div
                role="status"
                className={`p-3 rounded-xl text-xs font-medium ${
                  feedbackMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}

            <div>
              <label
                htmlFor={classSelectId}
                className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-2"
              >
                Classe visée
              </label>
              <select
                id={classSelectId}
                value={selectedClassId}
                onChange={(event) => onSelectedClassChange(event.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-sacred-red"
                required
              >
                <option value="">Sélectionnez une classe</option>
                {eligibleClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.nom_classe}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-muted w-full sm:w-auto"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedClassId ||
                  feedbackMessage?.type === "success"
                }
                className="px-6 py-2.5 rounded-full bg-sacred-red text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform disabled:opacity-50 w-full sm:w-auto grid place-items-center"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
