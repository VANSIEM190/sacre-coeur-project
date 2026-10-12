import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserRole } from "@sacre-coeur/domain/types";
import { useLoginForm } from "@sacre-coeur/auth/hooks/useLoginForm";
import {
  LoginForm,
  type LoginRoleOption,
} from "@sacre-coeur/ui/auth/login-form";

const ROLE_OPTIONS: readonly LoginRoleOption<UserRole>[] = [
  { value: "teacher", label: "Enseignant" },
  { value: "parent", label: "Parent" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const form = useLoginForm({
    initialRole: "parent",
    onAuthenticated: (role) => {
      if (role === "parent" || role === "teacher")
        navigate(`/${role}`, { replace: true });
    },
  });
  useEffect(() => {
    document.title = "Connexion — Sacré Cœur";
  }, []);

  return (
    <LoginForm
      {...form}
      roleOptions={ROLE_OPTIONS}
      footer={
        form.role === "parent" ? (
          <div>
            Pas encore inscrit ?{" "}
            <Link
              to="/inscription"
              className="text-sacred-red font-semibold hover:underline"
            >
              Créer un compte parent
            </Link>
          </div>
        ) : (
          <p>
            Première connexion ? Définissez votre mot de passe avec le lien
            d’invitation reçu par e-mail.
          </p>
        )
      }
    />
  );
}
