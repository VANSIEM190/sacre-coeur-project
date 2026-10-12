import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAuthStore,
  setVerifiedSession,
} from "@sacre-coeur/auth/stores/auth-store";
import { authService } from "@sacre-coeur/data-access/services/auth/auth.service";
import { getErrorMessage } from "@sacre-coeur/data-access/services/core/Supabase.error.handler";
import {
  AuthLayout,
  AuthField,
  AuthError,
} from "@sacre-coeur/ui/auth/auth-layout";
import { SessionLoading } from "@sacre-coeur/auth/components/session-loading";
import { passwordSchema } from "@sacre-coeur/domain/validators/profilSchema";
import { hasPasswordSetupCallback } from "@sacre-coeur/data-access/supabase/password-callback";

export default function InvitationPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    document.title = "Invitation enseignant — Sacré Cœur";
  }, []);

  const retryVerification = async () => {
    setIsLoading(true);
    setError("");
    try {
      const user = await authService.getAuthenticatedUser();
      if (user?.role === "teacher") setVerifiedSession(user);
      else
        setError(
          "Ce lien est indisponible. Demandez une nouvelle invitation à la direction.",
        );
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Reuse the existing password rules without the current-password field,
    // since an invitation creates the teacher's first password.
    const validation = passwordSchema.shape.newPassword.safeParse(password);
    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ?? "Vérifiez votre mot de passe.",
      );
      return;
    }
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await authService.setInvitedTeacherPassword(password);
      await logout();
      setPassword("");
      setConfirmation("");
      navigate("/login", { replace: true });
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") return <SessionLoading />;
  return (
    <AuthLayout
      title="Activation"
      subtitle="Définissez votre mot de passe pour accéder à votre espace enseignant."
    >
      {currentUser?.role !== "teacher" || !hasPasswordSetupCallback() ? (
        <div className="space-y-6">
          <AuthError
            message={
              error ||
              "Ouvrez le lien reçu par e-mail. S’il a expiré ou si cette page a été rechargée, demandez une nouvelle invitation à la direction."
            }
          />
          {hasPasswordSetupCallback() && (
            <button
              type="button"
              onClick={retryVerification}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-sacred-red text-white font-semibold disabled:opacity-50"
            >
              {isLoading ? "Vérification..." : "Réessayer la vérification"}
            </button>
          )}
          <Link
            to="/login"
            className="text-sacred-red font-semibold hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm opacity-60">{currentUser.email}</p>
          <AuthField label="Définir un mot de passe">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </AuthField>
          <AuthField label="Confirmer le mot de passe">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </AuthField>
          <AuthError message={error} />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-sacred-red text-white font-semibold shadow-lg shadow-sacred-red/20 hover:scale-[1.01] transition-transform disabled:cursor-not-allowed"
          >
            {isLoading ? "Chargement..." : "Activer mon espace"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
