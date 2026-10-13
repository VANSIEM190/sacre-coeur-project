import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AuthError,
  AuthField,
  AuthLayout,
} from "@sacre-coeur/ui/auth/auth-layout";
import { useTeacherActivation } from "../hooks/useTeacherActivation";

export default function TeacherActivationPage() {
  const activation = useTeacherActivation();

  useEffect(() => {
    document.title = "Première inscription enseignant — Sacré Cœur";
  }, []);

  return (
    <AuthLayout
      title={activation.activatedEmail ? "Compte activé" : "Première inscription"}
      subtitle={
        activation.activatedEmail
          ? "Vous pouvez maintenant vous connecter avec votre adresse e-mail et votre mot de passe."
          : "Saisissez le matricule remis par l’administration et choisissez votre mot de passe."
      }
    >
      {activation.activatedEmail ? (
        <div className="space-y-5">
          <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            Le compte associé à {activation.activatedEmail} est activé.
          </p>
          <Link
            to="/login"
            className="block w-full rounded-xl bg-sacred-red py-3.5 text-center font-semibold text-white"
          >
            Aller à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={activation.submit} className="space-y-4">
          <AuthField label="Matricule d’activation">
            <input
              type="text"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={activation.teacherAccessId}
              onChange={(event) => activation.setTeacherAccessId(event.target.value)}
              className="auth-input"
              placeholder="SC-T-…"
            />
          </AuthField>
          <AuthField label="Créer un mot de passe">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={activation.password}
              onChange={(event) => activation.setPassword(event.target.value)}
              className="auth-input"
            />
          </AuthField>
          <AuthField label="Confirmer le mot de passe">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={activation.confirmation}
              onChange={(event) => activation.setConfirmation(event.target.value)}
              className="auth-input"
            />
          </AuthField>
          <AuthError message={activation.error} />
          <button
            type="submit"
            disabled={activation.isSubmitting}
            className="w-full rounded-xl bg-sacred-red py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {activation.isSubmitting ? "Activation…" : "Activer mon compte"}
          </button>
          <Link to="/login" className="block text-center text-sm text-sacred-red hover:underline">
            Déjà inscrit ? Se connecter
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
