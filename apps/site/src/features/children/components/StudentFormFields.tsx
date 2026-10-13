import type { ClassName } from "@sacre-coeur/domain/types";
import { FormGrid, FormikField, FormikSelect } from "../../../shared/forms/FormikFields";
import type { ReactNode } from "react";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border/60 pt-6 first:border-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-sacred-red">{title}</h4>
      {children}
    </section>
  );
}

export function StudentIdentityFields({ isSaving }: { isSaving: boolean }) {
  return (
    <FormSection title="Identité de l'enfant">
      <FormGrid>
        <FormikField name="lastName" label="Nom" disabled={isSaving} />
        <FormikField name="middleName" label="Postnom" disabled={isSaving} />
        <FormikField name="firstName" label="Prénom" disabled={isSaving} />
        <FormikField name="birthDate" label="Date de naissance" type="date" disabled={isSaving} />
        <FormikField name="birthPlace" label="Lieu de naissance" disabled={isSaving} />
        <FormikSelect name="gender" label="Sexe" disabled={isSaving} options={[
          { value: "M", label: "Masculin" }, { value: "F", label: "Féminin" },
        ]} />
      </FormGrid>
    </FormSection>
  );
}

export function StudentGuardianFields({ isSaving }: { isSaving: boolean }) {
  return (
    <FormSection title="Parents & Tuteurs">
      <FormGrid>
        <FormikField name="fatherName" label="Nom du père" disabled={isSaving} />
        <FormikField name="motherName" label="Nom de la mère" disabled={isSaving} />
        <FormikField name="fatherProfession" label="Profession du père" disabled={isSaving} />
        <FormikField name="motherProfession" label="Profession de la mère" disabled={isSaving} />
        <FormikField name="guardianRelation" label="Degré de parenté" disabled={isSaving} />
        <FormikField name="phone" label="Numéro de téléphone" disabled={isSaving} />
      </FormGrid>
      <FormikField name="childMedicalCondition" label="L'enfant souffre de (facultatif)" disabled={isSaving} />
    </FormSection>
  );
}

export function StudentSchoolFields({
  classes,
  isClassLocked,
  isSaving,
}: {
  classes: ClassName[];
  isClassLocked: boolean;
  isSaving: boolean;
}) {
  return (
    <FormSection title="Scolarité">
      <FormGrid>
        <FormikSelect
          name="currentClassName"
          label="Classe actuelle"
          options={classes.map((schoolClass) => ({ value: schoolClass.id, label: schoolClass.nom_classe }))}
          disabled={isClassLocked || isSaving}
          helperText={isClassLocked ? "La classe ne peut plus être modifiée ici : elle change uniquement via la réinscription." : undefined}
        />
        <FormikField name="previousSchoolName" label="École de provenance" disabled={isSaving} />
        <FormikField name="previousSchoolPercentage" label="Pourcentage école précédente" type="number" disabled={isSaving} />
      </FormGrid>
    </FormSection>
  );
}

export function StudentAddressFields({ isSaving }: { isSaving: boolean }) {
  return (
    <FormSection title="Adresse & Religion">
      <FormGrid>
        <FormikField name="address" label="Adresse" disabled={isSaving} />
        <FormikField name="province" label="Province" disabled={isSaving} />
        <FormikField name="religion" label="Religion" disabled={isSaving} />
      </FormGrid>
    </FormSection>
  );
}
