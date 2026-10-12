import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@sacre-coeur/domain/types";
import { useLoginForm } from "@sacre-coeur/auth/hooks/useLoginForm";
import {
  LoginForm,
  type LoginRoleOption,
} from "@sacre-coeur/ui/auth/login-form";

const ROLE_OPTIONS: readonly LoginRoleOption<UserRole>[] = [
  { value: "admin", label: "Administration" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const form = useLoginForm({
    initialRole: "admin",
    onAuthenticated: () => navigate("/", { replace: true }),
  });
  useEffect(() => {
    document.title = "Administration — Sacré Cœur";
  }, []);
  return (
    <LoginForm
      {...form}
      roleOptions={ROLE_OPTIONS}
      subtitle="Accédez à l’administration de l’école."
    />
  );
}
