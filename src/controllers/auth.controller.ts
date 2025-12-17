import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/saveImage";
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
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 getSession function");
    console.log("🔵 Starting to get session:", { token });
    try {
      const session = await auth.api.getSession({ query: { token } } as any);
      console.log("✅ Session retrieved successfully:", session);
      return session;
    } catch (error: any) {
      console.error("❌ Get session failed:", error);
      throw new Error(`Get session failed: ${error?.message ?? String(error)}`);
    }
  },
  register: async (_: unknown, { name , email, password, role }: AuthArgs) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 register function");
    console.log("🔵 Starting registration for:", { name, email, role });
    try {
      console.log("🔍 Checking if user exists...");
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        console.log("❌ User already exists");
        throw new Error("User already exists");
      }
      console.log("✅ User doesn't exist, proceeding...");

      // Use better-auth client to sign up
      console.log("🔵 Calling better-auth signUpEmail...");
      try {
        const result = await auth.api.signUpEmail({ body: { name, email, password } });
        console.log("✅ Better-auth signup result:", result);
      } catch (authError: any) {
        console.error("❌ Better-auth error details:");
        console.error("  - Message:", authError.message);
        console.error("  - Status:", authError.status);
        console.error("  - Response:", authError.response);
        console.error("  - Full error:", JSON.stringify(authError, null, 2));
        throw authError;
      }

      if (role === "CHAUFFEUR") {
        console.log("🔵 User is CHAUFFEUR, updating role...");
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
          console.log("✅ Role updated to CHAUFFEUR");
        }
      }

      console.log("🔍 Fetching user from database...");
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.log("❌ User not found after registration");
        throw new Error("Registration failed");
      }
      console.log("✅ User found:", user);

      console.log("🔵 Generating token...");
      const tokenData = await generateToken(user.id);
      console.log("✅ Token generated successfully");
      
      console.log("🎉 Registration completed successfully!");
      return { user: user, token: tokenData.token };
      
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      throw new Error(
        `Registration failed: ${error?.message ?? String(error)}`
      );
    }
  },

  login: async (_: unknown, { email, password }: AuthArgs) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 login function");
    console.log("🔵 Starting login for:", { email });
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
   loginWithPhone: async (_: unknown, { telephone, password }: { telephone: string; password: string }) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 loginWithPhone function");
    console.log("🔵 Starting phone login for:", telephone);
    try {
      // Find user by phone number
      console.log("🔍 Looking up user by phone...");
      const user = await prisma.user.findUnique({ where: { telephone } });
      
      if (!user) {
        console.log("❌ Phone number not found");
        throw new Error("Invalid phone number or password");
      }
      console.log("✅ User found:", user.name);

      // Get the generated email for better-auth
      const generatedEmail = `${telephone.replace(/[^0-9]/g, '')}@phone.local`;
      
      console.log("🔵 Authenticating with better-auth...");
      try {
        const session = await auth.api.signInEmail({ 
          body: { 
            email: generatedEmail, 
            password 
          } 
        });
        
        if (!session) {
          throw new Error("Invalid credentials");
        }
        console.log("✅ Authentication successful");
      } catch (authError: any) {
        console.error("❌ Authentication error:", authError.message);
        throw new Error("Invalid phone number or password");
      }

      // Generate token
      console.log("🔵 Generating token...");
      const tokenData = await generateToken(user.id);
      console.log("✅ Token generated successfully");

      console.log("🎉 Phone login completed successfully!");
      return {
        token: tokenData.token,
        user,
      };
    } catch (error: any) {
      console.error("❌ Phone login error:", error);
      throw new Error(
        `Phone authentication failed: ${error?.message ?? String(error)}`
      );
    }
  },
  generateToken: async (userId: string) => {
    try {
      console.log("🔵 Starting to generate token:", { userId });
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
      console.log("🔵 Starting to logout:", { token });
      // signOut expects an object with query or fetchOptions
      await auth.api.signOut({query: { token }} as any);
      console.log("✅ Logout successfully");
      return { success: true };
    } catch (error: any) {
      console.log("❌ Logout failed:", error);
      throw new Error(`Logout failed: ${error?.message ?? String(error)}`);
    }
  },
  forgotPassword: async (email: string) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 forgotPassword function");
    try {
      console.log("🔵 Starting to forgot password:", { email });
      await auth.api.forgetPassword({ body: { email } });
      console.log("✅ Forgot password successfully");
      return { success: true };
    } catch (error: any) {
      console.log("❌ Forgot password failed:", error);
      throw new Error(
        `Forgot password failed: ${error?.message ?? String(error)}`
      );
    }
  },
  forgotPasswordWithPhone: async (telephone: string) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 forgotPasswordWithPhone function");
    console.log("🔵 Starting phone password reset for:", telephone);
    try {
      // 1. Check if user exists
      const user = await prisma.user.findUnique({ where: { telephone } });
      
      if (!user) {
        // For security, don't reveal if user doesn't exist, but log it
        console.log("❌ Phone number not found for reset");
        // We still return true to prevent enumeration attacks, or throw if you prefer strict feedback
        throw new Error("Phone number not found");
      }

      console.log("✅ User found for phone reset:", user.id);

      // 2. Simulate sending SMS
      // In a real app, you would generate a code (e.g. 6 digits), save it to DB/Redis, and send via Twilio/Vonage using `telephone`
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`📲 [MOCK SMS] Sending reset code ${resetCode} to ${telephone}`);
      
      // TODO: Integrate SMS provider here
      // await sendSms(telephone, `Your reset code is ${resetCode}`);

      return true;
    } catch (error: any) {
      console.error("❌ Phone password reset failed:", error);
      throw new Error(
        `Phone password reset failed: ${error?.message ?? String(error)}`
      );
    }
  },
  changePassword: async ({userId, password}: {userId: string, password: string}) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 changePassword function");
    try {
      console.log("🔵 Starting to change password:", { userId, password });
      const user = await prisma.user.update({
        where: { id: userId },
        data: { password },
      });
      console.log("✅ Password changed successfully:", user);
      return user;
    } catch (error: any) {
      throw new Error(`Change password failed: ${error?.message ?? String(error)}`);
    }
  },
  updateProfile: async ({userId, data}: {userId: string, data: any}) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 updateProfile function");
    try {
      console.log("🔵 Starting to update profile:", { userId, data });
      
      const dataToUpdate = { ...data };
      if (data.image) {
        dataToUpdate.image = saveImage(data.image);
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
      console.log("✅ Profile updated successfully:", user);
      return user;
    } catch (error: any) {
      throw new Error(`Update profile failed: ${error?.message ?? String(error)}`);
    }
  },



  // Phone-based authentication
  registerWithPhone: async (_: unknown, { name, telephone, password, role }: { name: string; telephone: string; password: string; role?: "GESTIONNAIRE" | "CHAUFFEUR" }) => {
    console.log("/controllers/auth.controller.ts");
    console.log("🔵 registerWithPhone function");
    console.log("🔵 Starting phone registration for:", { name, telephone, role });
    try {
      console.log("🔍 Checking if phone number exists...");
      const existingUser = await prisma.user.findUnique({ where: { telephone } });
      if (existingUser) {
        console.log("❌ Phone number already registered");
        throw new Error("Phone number already registered");
      }
      console.log("✅ Phone number available, proceeding...");

      // Create user with phone number as email substitute (better-auth requires email)
      // We'll use a generated email format: phone@phone.local
      const generatedEmail = `${telephone.replace(/[^0-9]/g, '')}@phone.local`;
      
      console.log("🔵 Creating user with better-auth...");
      try {
        await auth.api.signUpEmail({ 
          body: { 
            name, 
            email: generatedEmail, 
            password 
          } 
        });
        console.log("✅ Better-auth signup successful");
      } catch (authError: any) {
        console.error("❌ Better-auth error:", authError.message);
        throw authError;
      }

      // Update user with phone number and role
      console.log("🔵 Updating user with phone number and role...");
      const user = await prisma.user.update({
        where: { email: generatedEmail },
        data: {
          telephone,
          role: role || "GESTIONNAIRE",
        },
      });
      console.log("✅ User updated with phone and role");

      console.log("🔵 Generating token...");
      const tokenData = await generateToken(user.id);
      console.log("✅ Token generated successfully");
      
      console.log("🎉 Phone registration completed successfully!");
      return { user, token: tokenData.token };
      
    } catch (error: any) {
      console.error("❌ Phone registration error:", error);
      throw new Error(
        `Phone registration failed: ${error?.message ?? String(error)}`
      );
    }
  },

 
};
