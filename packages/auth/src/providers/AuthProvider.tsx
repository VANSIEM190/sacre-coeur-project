import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@sacre-coeur/domain/types";
import { authService } from "@sacre-coeur/data-access/services/auth/auth.service";
import { getErrorMessage } from "@sacre-coeur/data-access/services/core/Supabase.error.handler";
import { supabase } from "@sacre-coeur/data-access/supabase/supabaseClient";
import { consumePasswordSetupCallback } from "@sacre-coeur/data-access/supabase/password-callback";
import { setVerifiedSession, useAuthStore } from "../stores/auth-store";

interface AuthProviderProps {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
}

export function AuthProvider({ allowedRoles, children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let disposed = false;
    let requestVersion = 0;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    // Discard the old locally asserted identity and its fictitious user list.
    try {
      localStorage.removeItem("sacre-coeur-auth");
    } catch {
      // Restricted storage must not prevent server session verification.
    }

    const unsubscribeStore = useAuthStore.subscribe((state, previous) => {
      const identity =
        state.currentUser &&
        `${state.currentUser.id}:${state.currentUser.role}`;
      const previousIdentity =
        previous.currentUser &&
        `${previous.currentUser.id}:${previous.currentUser.role}`;
      if (identity !== previousIdentity) queryClient.clear();
      if (state.isAuthenticating && !previous.isAuthenticating)
        requestVersion += 1;
    });

    const refresh = async () => {
      if (disposed || useAuthStore.getState().isAuthenticating) return;
      const version = ++requestVersion;
      try {
        const user = await authService.getAuthenticatedUser();
        if (
          disposed ||
          version !== requestVersion ||
          useAuthStore.getState().isAuthenticating
        )
          return;

        if (user && !allowedRoles.includes(user.role)) {
          setVerifiedSession(
            null,
            "Ce compte n’est pas autorisé dans cet espace.",
          );
          await authService.logout();
          return;
        }
        setVerifiedSession(user);
      } catch (error) {
        if (!disposed && version === requestVersion) {
          setVerifiedSession(null, getErrorMessage(error));
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (disposed) return;
      if (event === "SIGNED_OUT") {
        requestVersion += 1;
        consumePasswordSetupCallback();
        setVerifiedSession(null);
        queryClient.clear();
        return;
      }

      if (
        session &&
        session.user.id !== useAuthStore.getState().currentUser?.id &&
        !useAuthStore.getState().isAuthenticating
      ) {
        useAuthStore.setState({
          currentUser: null,
          status: "loading",
          error: null,
        });
      }
      // Supabase callbacks run while its auth lock is held. Defer the next
      // Supabase request instead of awaiting it inside onAuthStateChange.
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void refresh();
      }, 0);
    });

    void refresh();
    return () => {
      disposed = true;
      requestVersion += 1;
      clearTimeout(refreshTimer);
      subscription.unsubscribe();
      unsubscribeStore();
    };
  }, [allowedRoles, queryClient]);

  return children;
}
