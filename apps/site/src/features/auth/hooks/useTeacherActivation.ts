import { useState, type FormEvent } from "react";
import { authService } from "@sacre-coeur/data-access/services/auth/auth.service";
import { getErrorMessage } from "@sacre-coeur/data-access/services/core/Supabase.error.handler";
import { passwordSchema } from "@sacre-coeur/domain/validators/profilSchema";

export function useTeacherActivation() {
  const [teacherAccessId, setTeacherAccessId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activatedEmail, setActivatedEmail] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    const passwordResult = passwordSchema.shape.newPassword.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.issues[0]?.message ?? "Mot de passe invalide.");
      return;
    }
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const email = await authService.activateTeacher(
        teacherAccessId.trim().toUpperCase(),
        password,
      );
      setActivatedEmail(email);
      setPassword("");
      setConfirmation("");
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    teacherAccessId,
    password,
    confirmation,
    error,
    isSubmitting,
    activatedEmail,
    setTeacherAccessId,
    setPassword,
    setConfirmation,
    submit,
  };
}
