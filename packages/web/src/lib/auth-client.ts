import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: (typeof window !== "undefined" ? (window as any).__API_URL : "") || window.location.origin,
});
