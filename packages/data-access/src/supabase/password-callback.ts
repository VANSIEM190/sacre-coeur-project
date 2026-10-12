type PasswordCallbackType = "invite" | "recovery";

// Evaluated before createClient consumes the callback URL. This marker guides
// the password setup UI only; Supabase still verifies the actual user/session.
// No token or callback URL is copied into application state or storage.
const passwordCallbackType: PasswordCallbackType | null = (() => {
  if (typeof window === "undefined") return null;
  const parameters = new URLSearchParams(window.location.hash.slice(1));
  const type = parameters.get("type");
  if (
    (type === "invite" || type === "recovery") &&
    parameters.get("access_token") &&
    parameters.get("refresh_token")
  )
    return type;
  return null;
})();

let consumed = false;

export function hasPasswordSetupCallback(): boolean {
  return passwordCallbackType !== null && !consumed;
}

export function consumePasswordSetupCallback(): void {
  consumed = true;
}
