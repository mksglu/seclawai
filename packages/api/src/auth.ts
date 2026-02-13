import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as authSchema from "./db/auth-schema.drizzle.js";
import type { Bindings } from "./app.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export function getAuth(env: Bindings) {
  const db = drizzle(env.DB, { schema: authSchema });

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    },
    trustedOrigins: [
      env.CORS_ORIGIN,
      env.BETTER_AUTH_URL,
      "http://localhost:8787",
      "http://localhost:5173",
    ],
  });
}
