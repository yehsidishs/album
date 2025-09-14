export const GOOGLE_AUTH_URL = "/api/auth/google";

export function initiateGoogleAuth() {
  window.location.href = GOOGLE_AUTH_URL;
}
