import { createAuthClient } from "better-auth/react";

const baseURL = typeof window !== "undefined"
  ? window.location.hostname === "localhost"
    ? "http://localhost:8788"  // dev: direct to API
    : window.location.origin   // prod: same-origin proxy
  : "";

export const authClient = createAuthClient({ baseURL });
