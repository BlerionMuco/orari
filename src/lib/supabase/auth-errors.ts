import {
  isAuthError,
  isAuthSessionMissingError,
  isAuthRetryableFetchError,
  isAuthWeakPasswordError,
  type AuthError,
} from "@supabase/supabase-js";

// Discriminated outcome for a failed password update. Drives both the retry
// decision and the user-facing message in the reset-password page.
export type UpdatePasswordFailure =
  | { kind: "expired" } // genuine: no/expired recovery session — offer a new link
  | { kind: "weak-password" } // server rejected password strength
  | { kind: "transient" } // retryable / session not yet hydrated — retry once
  | { kind: "unknown" };

export function classifyUpdatePasswordError(
  error: unknown,
): UpdatePasswordFailure {
  // Session missing right after the callback is the hydration race, not a dead
  // link — treat as transient so the page retries once.
  if (isAuthSessionMissingError(error)) return { kind: "transient" };
  if (isAuthRetryableFetchError(error)) return { kind: "transient" };
  if (isAuthWeakPasswordError(error)) return { kind: "weak-password" };
  if (isAuthError(error)) {
    const e: AuthError = error;
    if (e.status === 401 || e.status === 403) return { kind: "expired" };
    if (e.code === "otp_expired" || e.code === "session_not_found") {
      return { kind: "expired" };
    }
    if (typeof e.status === "number" && e.status >= 500) {
      return { kind: "transient" };
    }
    return { kind: "unknown" };
  }
  return { kind: "unknown" };
}

export function describeUpdatePasswordError(error: unknown): string {
  if (isAuthError(error)) {
    return `${error.name} status=${String(error.status)} code=${String(error.code)} message=${error.message}`;
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "non-error thrown value";
}
