import { create } from "zustand";
import type { AnyUser, UserRole } from "@sacre-coeur/domain/types";
import { authService } from "@sacre-coeur/data-access/services/auth/auth.service";
import { getErrorMessage } from "@sacre-coeur/data-access/services/core/Supabase.error.handler";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface LoginResult {
  ok: boolean;
  role?: UserRole;
  error?: string;
}

interface AuthState {
  currentUser: AnyUser | null;
  status: SessionStatus;
  error: string | null;
  isAuthenticating: boolean;
  login: (
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

// Supabase owns token persistence. Application identity stays in memory and is
// restored only after the server has verified the session and its profile.
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  status: "loading",
  error: null,
  isAuthenticating: false,

  login: async (email, password, role) => {
    if (!email.trim() || !password) {
      return { ok: false, error: "Veuillez remplir tous les champs." };
    }

    set({
      currentUser: null,
      status: "loading",
      error: null,
      isAuthenticating: true,
    });
    try {
      const result = await authService.login(email.trim(), password, role);
      set({ currentUser: result.user, status: "authenticated" });
      return { ok: true, role: result.role };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ currentUser: null, status: "anonymous", error: message });
      return { ok: false, error: message };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ currentUser: null, status: "anonymous", error: null });
    }
  },
}));

export function setVerifiedSession(
  user: AnyUser | null,
  error: string | null = null,
) {
  useAuthStore.setState({
    currentUser: user,
    status: user ? "authenticated" : "anonymous",
    error,
  });
}
