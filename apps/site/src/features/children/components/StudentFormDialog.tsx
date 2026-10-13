import { AnimatePresence, motion } from "framer-motion";
import { Form, Formik } from "formik";
import { X } from "lucide-react";
import type { ClassName, EleveDetails } from "@sacre-coeur/domain/types";
import { studentSchema, type studentType } from "@sacre-coeur/domain/validators/usersSchema";
import { validateWithZod } from "@sacre-coeur/domain/utils/validateWithZod";
import { initialChildValues } from "../types/child-form";
import {
  StudentAddressFields,
  StudentGuardianFields,
  StudentIdentityFields,
  StudentSchoolFields,
} from "./StudentFormFields";

interface StudentFormDialogProps {
  isOpen: boolean;
  student: EleveDetails | null;
  classes: ClassName[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: studentType, student: EleveDetails | null) => void;
}

export function StudentFormDialog({ isOpen, student, classes, isSaving, onClose, onSubmit }: StudentFormDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-4xl border border-border bg-card shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border p-6 md:p-8">
              <div>
                <h3 className="font-display text-3xl">{student ? "Modifier l'élève" : "Inscrire un enfant"}</h3>
                <p className="mt-1 text-sm opacity-60">
                  {student ? "Mettez à jour les informations du dossier scolaire." : "Remplissez ce formulaire pour ajouter un nouvel enfant."}
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-2 transition-colors hover:bg-muted">
                <X className="size-6" />
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto p-6 md:p-8">
              <Formik<studentType>
                initialValues={(student || initialChildValues) as studentType}
                enableReinitialize
                validate={validateWithZod(studentSchema)}
                onSubmit={(values) => onSubmit(values, student)}
              >
                <Form className="space-y-8">
                  <StudentIdentityFields isSaving={isSaving} />
                  <StudentGuardianFields isSaving={isSaving} />
                  <StudentSchoolFields classes={classes} isClassLocked={!!student} isSaving={isSaving} />
                  <StudentAddressFields isSaving={isSaving} />
                  <footer className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-sm text-xs opacity-60">
                      Toutes les modifications ou ajouts restent soumis à la validation finale de l'administration.
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={onClose} disabled={isSaving} className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50">
                        Annuler
                      </button>
                      <button type="submit" disabled={isSaving} className="rounded-full bg-sacred-red px-8 py-3.5 font-semibold text-white shadow-lg shadow-sacred-red/20 transition-transform hover:scale-105 disabled:opacity-50">
                        {isSaving ? "Enregistrement..." : student ? "Enregistrer" : "Créer l'enfant"}
                      </button>
                    </div>
                  </footer>
                </Form>
              </Formik>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
