import { JWT_SECRET } from "@/config/auth";
import { auth } from "@/lib/auth";
import log from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/saveImage";
import { generateToken } from "@/utils/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type AuthArgs = {
  name: string;
  email: string;
  password: string;
  role?: "GESTIONNAIRE" | "CHAUFFEUR";
};



export const AuthController = {
  getSession: async (token: string) => {
    log("/controllers/auth.controller.ts");
    log("🔵 getSession function");
    log("🔵 Starting to get session:", { token });
    try {
      const session = await auth.api.getSession({ query: { token } } as any);
      log("✅ Session retrieved successfully:", session);
      return session;
    } catch (error: any) {
      log("❌ Get session failed:", error);
      throw new Error(`Get session failed: ${error?.message ?? String(error)}`);
    }
  },
  register: async (_: unknown, { name , email, password, role }: AuthArgs) => {
    log("/controllers/auth.controller.ts");
    log("🔵 register function");
    log("🔵 Starting registration for:", { name, email, role });
    try {
      log("🔍 Checking if user exists...");
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        log("❌ User already exists");
        throw new Error("User already exists");
      }
      log("✅ User doesn't exist, proceeding...");

      // Use better-auth client to sign up
      log("🔵 Calling better-auth signUpEmail...");
      try {
        const result = await auth.api.signUpEmail({ body: { name, email, password } });
        log("✅ Better-auth signup result:", result);
      } catch (authError: any) {
        log("❌ Better-auth error details:");
        log("  - Message:", authError.message);
        log("  - Status:", authError.status);
        log("  - Response:", authError.response);
        log("  - Full error:", JSON.stringify(authError, null, 2));
        throw authError;
      }

      if (role === "CHAUFFEUR") {
        log("🔵 User is CHAUFFEUR, updating role...");
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
          log("✅ Role updated to CHAUFFEUR");
        }
      }

      log("🔍 Fetching user from database...");
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        log("❌ User not found after registration");
        throw new Error("Registration failed");
      }
      log("✅ User found:", user);

      log("🔵 Generating token...");
      const tokenData = await generateToken(user.id);
      log("✅ Token generated successfully");
      
      log("🎉 Registration completed successfully!");
      return { user: user, token: tokenData.token };
      
    } catch (error: any) {
      log("❌ Registration error:", error);
      throw new Error(
        `Registration failed: ${error?.message ?? String(error)}`
      );
    }
  },

  login: async (_: unknown, { email, password }: AuthArgs) => {
    log("/controllers/auth.controller.ts");
    log("🔵 login function");
    log("🔵 Starting login for:", { email });
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
   loginWithPhone: async (
  _: unknown,
  { telephone, password }: { telephone: string; password: string }
) => {
  log("/controllers/auth.controller.ts");
  log("🔵 loginWithPhone function");
  log(`🔵 Starting phone login for: ${telephone}`);
  try {
    // Rechercher l'utilisateur par numéro de téléphone
    log("🔍 Looking up user by phone...");
    const user = await prisma.user.findUnique({ where: { telephone } });

    if (!user) {
      log("❌ Phone number not found");
      throw new Error("Invalid phone number or password");
    }
    log(`✅ User found: ${user.name}`);

    // Utiliser l'email réel de l'utilisateur pour l'authentification
    const userEmail = user.email;
    log(`📧 Using user email: ${userEmail} for authentication`);

    log("🔵 Authenticating with better-auth...");
    try {
      const session = await auth.api.signInEmail({
        body: {
          email: userEmail,
          password,
        },
      });

      if (!session) {
        throw new Error("Invalid credentials");
      }
      log("✅ Authentication successful");
    } catch (authError: any) {
      log(`❌ Authentication error: ${authError.message}`);
      throw new Error("Invalid phone number or password");
    }

    // Générer le token
    log("🔵 Generating token...");
    const tokenData = await generateToken(user.id);
    log("✅ Token generated successfully");

    log("🎉 Phone login completed successfully!");
    return {
      token: tokenData.token,
      user,
    };
  } catch (error: any) {
    log(`❌ Phone login error: ${error}`);
    throw new Error(
      `Phone authentication failed: ${error?.message ?? String(error)}`
    );
  }
   },

  generateToken: async (userId: string) => {
    try {
      log("🔵 Starting to generate token:", { userId });
      if (!userId) throw new Error('userId is required');
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      log(`✅ AuthController token generated with secret: ${JWT_SECRET.substring(0, 5)}...`);

      return { token, user } as any;
    } catch (error: any) {
      log(`❌ AuthController generateToken failed: ${error.message}`);
      throw new Error(`Generate token failed: ${error?.message ?? String(error)}`);
    }
  },
  // Méthode pour la déconnexion
  logout: async (token: string, headers: any) => {
    try {
      log("🔵 Starting to logout:", { token });
      
      // Delete session from database if token exists
      if (token) {
        try {
          // Try to delete session by token
          await prisma.session.deleteMany({
            where: { token }
          });
          log("✅ Session deleted from database");
        } catch (dbError: any) {
          log("⚠️ Session delete from DB failed:", dbError.message);
        }
      }

      // Try better-auth signOut (best effort)
      try {
        await auth.api.signOut({
          headers: headers
        } as any);
        log("✅ Better-auth signOut successful");
      } catch (authError: any) {
        // If it's just "Failed to get session", it's normal for mobile/JWT apps
        if (authError?.message === "Failed to get session") {
          log("ℹ️ Better-auth: No active web session found to clear (normal for mobile)");
        } else {
          log("⚠️ Better-auth signOut warning:", authError?.message);
        }
      }

      log("✅ Logout successfully");
      return true;
    } catch (error: any) {
      log("⚠️ Logout process encountered a non-critical error:", error?.message);
      return true;
    }
  },
  forgotPassword: async (email: string) => {
    log("/controllers/auth.controller.ts");
    log("🔵 forgotPassword function");
    try {
      log("🔵 Starting to forgot password:", { email });
      await auth.api.forgetPassword({ body: { email } });
      log("✅ Forgot password successfully");
      return { success: true };
    } catch (error: any) {
      log("❌ Forgot password failed:", error);
      throw new Error(
        `Forgot password failed: ${error?.message ?? String(error)}`
      );
    }
  },
  forgotPasswordWithPhone: async (telephone: string) => {
    log("/controllers/auth.controller.ts");
    log("🔵 forgotPasswordWithPhone function");
    log("🔵 Starting phone password reset for:", telephone);
    try {
      // 1. Check if user exists
      const user = await prisma.user.findUnique({ where: { telephone } });
      
      if (!user) {
        // For security, don't reveal if user doesn't exist, but log it
        log("❌ Phone number not found for reset");
        // We still return true to prevent enumeration attacks, or throw if you prefer strict feedback
        throw new Error("Phone number not found");
      }

      log("✅ User found for phone reset:", user.id);

      // 2. Simulate sending SMS
      // In a real app, you would generate a code (e.g. 6 digits), save it to DB/Redis, and send via Twilio/Vonage using `telephone`
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      log(`📲 [MOCK SMS] Sending reset code ${resetCode} to ${telephone}`);
      
      // TODO: Integrate SMS provider here
      // await sendSms(telephone, `Your reset code is ${resetCode}`);

      return true;
    } catch (error: any) {
      log("❌ Phone password reset failed:", error);
      throw new Error(
        `Phone password reset failed: ${error?.message ?? String(error)}`
      );
    }
  },
  changePassword: async ({userId, password}: {userId: string, password: string}) => {
    log("/controllers/auth.controller.ts");
    log("🔵 changePassword function");
    try {
      log("🔵 Starting to change password:", { userId });
      
      // Hash the new password properly
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      log("✅ Password changed successfully:", user);
      return user;
    } catch (error: any) {
      throw new Error(`Change password failed: ${error?.message ?? String(error)}`);
    }
  },
  updateProfile: async ({userId, data}: {userId: string, data: any}) => {
    log("/controllers/auth.controller.ts");
    log("🔵 updateProfile function");
    try {
      log("🔵 Starting to update profile:", { userId, data });
      
      const dataToUpdate = { ...data };
      if (data.image) {
        dataToUpdate.image = saveImage(data.image);
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
      log("✅ Profile updated successfully:", user);
      return user;
    } catch (error: any) {
      throw new Error(`Update profile failed: ${error?.message ?? String(error)}`);
    }
  },
  // Phone-based authentication
  registerWithPhone: async (_: unknown, { name, telephone, password, role }: { name: string; telephone: string; password: string; role?: "GESTIONNAIRE" | "CHAUFFEUR" }) => {
    log("/controllers/auth.controller.ts");
    log("🔵 registerWithPhone function");
    log("🔵 Starting phone registration for:", { name, telephone, role });
    try {
      log("🔍 Checking if phone number exists...");
      const existingUser = await prisma.user.findUnique({ where: { telephone } });
      if (existingUser) {
        log("❌ Phone number already registered");
        throw new Error("Phone number already registered");
      }
      log("✅ Phone number available, proceeding...");

      // Create user with phone number as email substitute (better-auth requires email)
      // We'll use a generated email format: phone@phone.local
      const generatedEmail = `${telephone.replace(/[^0-9]/g, '')}@phone.local`;
      
      log("🔵 Creating user with better-auth...");
      try {
        await auth.api.signUpEmail({ 
          body: { 
            name, 
            email: generatedEmail, 
            password 
          } 
        });
        log("✅ Better-auth signup successful");
      } catch (authError: any) {
        log("❌ Better-auth error:", authError.message);
        throw authError;
      }

      // Update user with phone number and role
      log("🔵 Updating user with phone number and role...");
      const user = await prisma.user.update({
        where: { email: generatedEmail },
        data: {
          telephone,
          role: role || "GESTIONNAIRE",
        },
      });
      log("✅ User updated with phone and role");

      log("🔵 Generating token...");
      const tokenData = await generateToken(user.id);
      log("✅ Token generated successfully");
      
      log("🎉 Phone registration completed successfully!");
      return { user, token: tokenData.token };
      
    } catch (error: any) {
      log("❌ Phone registration error:", error);
      throw new Error(
        `Phone registration failed: ${error?.message ?? String(error)}`
      );
    }
  },
};
