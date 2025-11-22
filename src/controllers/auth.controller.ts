import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/utils/auth";
import jwt from "jsonwebtoken";

type AuthArgs = {
  name: string;
  email: string;
  password: string;
  role?: "GESTIONNAIRE" | "CHAUFFEUR";
};

const JWT_SECRET = process.env.JWT_SECRET || "TON_SECRET_JWT";

export const AuthController = {
  getSession: async (token: string) => {
    try {
      const session = await auth.api.getSession({ query: { token } } as any);
      return session;
    } catch (error: any) {
      throw new Error(`Get session failed: ${error?.message ?? String(error)}`);
    }
  },
  register: async (_: unknown, { name , email, password, role }: AuthArgs) => {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("User already exists");
      }

      // Use better-auth client to sign up
      const result = await auth.api.signUpEmail({ body: { name, email, password } });

      if (result && role === "CHAUFFEUR") {
        const chauffeur = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (chauffeur) {
          await prisma.user.update({
            where: { email },
            data: {
              role: role || "GESTIONNAIRE",
            },
          });
        }
      }

  
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Registration failed");

      const tokenData = await generateToken(user.id);
      return { user: user, token: tokenData.token };
      
    } catch (error: any) {
      throw new Error(
        `Registration failed: ${error?.message ?? String(error)}`
      );
    }
  },

  login: async (_: unknown, { email, password }: AuthArgs) => {
    try {
      const session = await auth.api.signInEmail({ body: { email, password } });

      if (!session) {
        throw new Error("Invalid credentials");
      }

      // Prefer the session's user payload, otherwise load from DB
      const userObj = (session as any).user ?? (await prisma.user.findUnique({ where: { email } }));
      if (!userObj) throw new Error('User not found after authentication');

      // Use centralized token generation
      const tokenData = await generateToken(userObj.id);

      return {
        token: tokenData.token,
        user: userObj,
      };
    } catch (error: any) {
      throw new Error(
        `Authentication failed: ${error?.message ?? String(error)}`
      );
    }
  },
  generateToken: async (userId: string) => {
    try {
      if (!userId) throw new Error('userId is required');
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return { token, user } as any;
    } catch (error: any) {
      throw new Error(`Generate token failed: ${error?.message ?? String(error)}`);
    }
  },
  // Méthode pour la déconnexion
  logout: async (token: string) => {
    try {
      // signOut expects an object with query or fetchOptions
      await auth.api.signOut({query: { token }} as any);
      return { success: true };
    } catch (error: any) {
      throw new Error(`Logout failed: ${error?.message ?? String(error)}`);
    }
  },
  forgotPassword: async (email: string) => {
    try {
      await auth.api.forgetPassword({ body: { email } });
      return { success: true };
    } catch (error: any) {
      throw new Error(
        `Forgot password failed: ${error?.message ?? String(error)}`
      );
    }
  },
};
