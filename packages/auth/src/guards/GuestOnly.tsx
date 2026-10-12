import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@sacre-coeur/domain/types";
import { useAuthStore } from "../stores/auth-store";
import { SessionLoading } from "../components/session-loading";

interface GuestOnlyProps {
  homeByRole: Partial<Record<UserRole, string>>;
}

export function GuestOnly({ homeByRole }: GuestOnlyProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const status = useAuthStore((state) => state.status);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  if (status === "loading" && !isAuthenticating) return <SessionLoading />;
  const destination = currentUser && homeByRole[currentUser.role];
  if (destination) return <Navigate to={destination} replace />;
  return <Outlet />;
}
