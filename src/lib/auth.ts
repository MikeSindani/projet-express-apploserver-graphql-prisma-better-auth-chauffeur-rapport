import { prisma } from '@/lib/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthClient } from "better-auth/client";



export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  secret: process.env.AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    maxPasswordLength: 100,
    minPasswordLength: 8,
    sendVerification: false,
  },
  providers: ['email-password'],
});

// Export a lightweight client for server-side usage/testing (points at the mounted auth endpoints)
export const authClient = createAuthClient({
  baseURL: process.env.AUTH_BASE_URL ?? 'http://localhost:4000/api/auth',
});







