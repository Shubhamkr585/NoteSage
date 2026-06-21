import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // You can pass client options here if needed
})

export const { signIn, signUp, signOut, useSession } = authClient;
