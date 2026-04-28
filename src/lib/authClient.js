import { createAuthClient } from "better-auth/react";

const isDev = import.meta.env.DEV;

export const authClient = createAuthClient({
    baseURL: isDev ? "http://localhost:3000" : "" // Empty string = same origin in production
});

export const { signIn, signUp, signOut, useSession } = authClient;

