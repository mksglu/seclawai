import { createAuthClient } from "better-auth/react";

// Always same-origin — dev proxy (8787) forwards /api/* to API (8788)
const baseURL = typeof window !== "undefined" ? window.location.origin : "";

export const authClient = createAuthClient({ baseURL });
