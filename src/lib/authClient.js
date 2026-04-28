import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000" // Backend Better Auth URL
});

export const { signIn, signUp, signOut, useSession } = authClient;
