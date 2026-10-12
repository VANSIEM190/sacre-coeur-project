import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { X } from "lucide-react";
import type { ClassName, EleveDetails } from "@sacre-coeur/domain/types";
import {
  studentSchema,
  type studentType,
} from "@sacre-coeur/domain/validators/usersSchema";
import { validateWithZod } from "@sacre-coeur/domain/utils/validateWithZod";
import { initialChildValues } from "../types/child-form";

interface StudentFormDialogProps {
  isOpen: boolean;
  student: EleveDetails | null;
  classes: ClassName[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: studentType, student: EleveDetails | null) => void;
}

interface FieldProps extends ComponentPropsWithoutRef<"input"> {
  name: string;
  label: string;
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function FormikField({
  name,
  label,
  type = "text",
  ...inputProps
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </span>
      <Field
        name={name}
        type={type}
        className="fk-input disabled:cursor-not-allowed disabled:opacity-60"
        {...inputProps}
      />
      <ErrorMessage
        name={name}
        component="div"
        className="mt-1 text-xs text-destructive"
      />
    </label>
  );
}

function FormikSelect({
  name,
  label,
  options,
  disabled,
  helperText,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </span>
      <Field name={name} as="select" className="fk-input" disabled={disabled}>
        <option value="">Sélectionnez une option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Field>
      {helperText && <p className="mt-1.5 text-xs opacity-60">{helperText}</p>}
      <ErrorMessage
        name={name}
        component="div"
        className="mt-1 text-xs text-destructive"
      />
    </label>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border/60 pt-6 first:border-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-sacred-red">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function StudentFormDialog({
  isOpen,
  student,
  classes,
  isSaving,
  onClose,
  onSubmit,
}: StudentFormDialogProps) {
  const isClassLocked = !!student;
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
            <div className="flex items-center justify-between border-b border-border p-6 md:p-8">
              <div>
                <h3 className="font-display text-3xl">
                  {student ? "Modifier l'élève" : "Inscrire un enfant"}
                </h3>
                <p className="mt-1 text-sm opacity-60">
                  {student
                    ? "Mettez à jour les informations du dossier scolaire."
                    : "Remplissez ce formulaire pour ajouter un nouvel enfant."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-full p-2 transition-colors hover:bg-muted"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6 md:p-8">
              <Formik<studentType>
                initialValues={(student || initialChildValues) as studentType}
                enableReinitialize
                validate={validateWithZod(studentSchema)}
                onSubmit={(values) => onSubmit(values, student)}
              >
                {() => (
                  <Form className="space-y-8">
                    <FormSection title="Identité de l'enfant">
                      <FormGrid>
                        <FormikField
                          name="lastName"
                          label="Nom"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="middleName"
                          label="Postnom"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="firstName"
                          label="Prénom"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="birthDate"
                          label="Date de naissance"
                          type="date"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="birthPlace"
                          label="Lieu de naissance"
                          disabled={isSaving}
                        />
                        <FormikSelect
                          name="gender"
                          label="Sexe"
                          options={[
                            { value: "M", label: "Masculin" },
                            { value: "F", label: "Féminin" },
                          ]}
                        />
                      </FormGrid>
                    </FormSection>
                    <FormSection title="Parents & Tuteurs">
                      <FormGrid>
                        <FormikField
                          name="fatherName"
                          label="Nom du père"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="motherName"
                          label="Nom de la mère"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="fatherProfession"
                          label="Profession du père"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="motherProfession"
                          label="Profession de la mère"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="guardianRelation"
                          label="Degré de parenté"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="phone"
                          label="Numéro de téléphone"
                          disabled={isSaving}
                        />
                      </FormGrid>
                      <FormikField
                        name="childMedicalCondition"
                        label="L'enfant souffre de (facultatif)"
                        disabled={isSaving}
                      />
                    </FormSection>
                    <FormSection title="Scolarité">
                      <FormGrid>
                        <FormikSelect
                          name="currentClassName"
                          label="Classe actuelle"
                          options={classes.map((classe) => ({
                            value: classe.id,
                            label: classe.nom_classe,
                          }))}
                          disabled={isClassLocked}
                          helperText={
                            isClassLocked
                              ? "La classe ne peut plus être modifiée ici : elle change uniquement via la réinscription."
                              : undefined
                          }
                        />
                        <FormikField
                          name="previousSchoolName"
                          label="École de provenance"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="previousSchoolPercentage"
                          label="Pourcentage école précédente"
                          type="number"
                          disabled={isSaving}
                        />
                      </FormGrid>
                    </FormSection>
                    <FormSection title="Adresse & Religion">
                      <FormGrid>
                        <FormikField
                          name="address"
                          label="Adresse"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="province"
                          label="Province"
                          disabled={isSaving}
                        />
                        <FormikField
                          name="religion"
                          label="Religion"
                          disabled={isSaving}
                        />
                      </FormGrid>
                    </FormSection>
                    <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-sm text-xs opacity-60">
                        Toutes les modifications ou ajouts restent soumis à la
                        validation finale de l'administration.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="rounded-full bg-sacred-red px-8 py-3.5 font-semibold text-white shadow-lg shadow-sacred-red/20 transition-transform hover:scale-105 disabled:opacity-50"
                        >
                          {isSaving
                            ? "Enregistrement..."
                            : student
                              ? "Enregistrer"
                              : "Créer l'enfant"}
                        </button>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
