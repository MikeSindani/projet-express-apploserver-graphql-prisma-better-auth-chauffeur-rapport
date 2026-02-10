import { auth } from "@/lib/auth";
import log from '@/lib/log'; // Added import for log
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/saveImage";




export const ChauffeurController = {
  // Suppose l'existence d'un modèle "trajet" avec champs { chauffeurId, cout, date }.
  count: async (organizationId?: string) => {
    log("/controllers/chauffeur.controller.ts"); 
    log("🔵 COUNT CHAUFFEUR FUNCTION");
    log("🔵 Starting to count chauffeurs", { organizationId });
    if (organizationId) {
      const count = await prisma.user.count({ 
        where: { 
          role: "CHAUFFEUR",
          organizationId 
        } 
      });
      log("🔵 Count chauffeurs successfully:", { count });
      return count;
    }
    log("🔵 Count chauffeurs successfully : 0 ");
    return 0
  },
  // Liste de tous les users de rôle CHAUFFEUR
  getAll: async (organizationId?: string) => {
    log("/controllers/chauffeur.controller.ts");
    log("🔵 GET ALL CHAUFFEUR FUNCTION", { organizationId });
    return await prisma.user.findMany({
      where: {
        role: "CHAUFFEUR",
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        vehicules: true,
      },
    });
  },

  // Un seul chauffeur (user) par id — garantit role = CHAUFFEUR
  getOne: async (id: string, organizationId?: string) => {
    log("/controllers/chauffeur.controller.ts");
    log("🔵 GET ONE CHAUFFEUR FUNCTION", { id, organizationId });
    return await prisma.user.findFirst({
      where: {
        id,
        role: "CHAUFFEUR",
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        vehicules: true,
      },
    });
  },

  create: async (data: any) => {
    log("/controllers/chauffeur.controller.ts");
    log("🔵 CREATE CHAUFFEUR FUNCTION");
    
    const { name, email, password, role, telephone, licenseNumber, licenseExpiryDate, licenseImage, organizationId, image } = data;
    log("🔵 Starting to create user:", { name, email, password, role, telephone, licenseNumber, licenseExpiryDate, organizationId, imageLen: image?.length, licenseImageLen: licenseImage?.length });
    
    // Validate that at least email or telephone is provided
    if (!email && !telephone) {
      throw new Error("Au moins un email ou un numéro de téléphone est requis.");
    }
    
    // Check if user already exists by email or phone
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("Un utilisateur avec cet email existe déjà.");
      }
    }
    
    if (telephone) {
      const existingUserByPhone = await prisma.user.findFirst({ where: { telephone } });
      if (existingUserByPhone) {
        throw new Error("Un utilisateur avec ce numéro de téléphone existe déjà.");
      }
    }
    
    log("🔵 User does not exist, creating...");
    
    // Create user with basic auth data
    if (email) {
      // Email-based registration
      await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        }
      });
      log("🔵 User created successfully with email, updating...");
      
      // Update user with Chauffeur specific data
      const user = await prisma.user.update({
        where: { email },
        data: {
          role: "CHAUFFEUR",
          telephone,
          licenseNumber,
          licenseExpiryDate,
          licenseImage: licenseImage ? saveImage(licenseImage) : undefined,
          organizationId: organizationId as any,
          organizationAccess: true,
          image: image ? saveImage(image) : undefined,
        },
      });
      log("🔵 User updated successfully:", user);
      return user;
    } else {
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
      } catch (error) {
        log("❌ Better-auth signup failed:", error);
        throw error;
      }
      log("🔵 User created successfully with phone, updating...");
       // Update user with Chauffeur specific data
      // We use generatedEmail to find the user we just created
      const user = await prisma.user.update({
        where: { email: generatedEmail },
        data: {
          role: "CHAUFFEUR",
          telephone,
          licenseNumber,
          licenseExpiryDate,
          licenseImage: licenseImage ? saveImage(licenseImage) : undefined,
          organizationId,
          organizationAccess: true,
          image: image ? saveImage(image) : undefined,
        },
      });
      log("🔵 User created successfully with phone:", user);
      return user;
    }
  },

  // Mise à jour d'un chauffeur (user)
  update: async (
    id: string,
    data: {
      id?: string;
      name?: string;
      email?: string;
      password?: string;
      telephone?: string;
      licenseNumber?: string;
      licenseExpiryDate?: string;
      licenseImage?: string;
      organizationId?: string;
      organizationAccess?: boolean;
      image?: string;
      // ne pas autoriser le changement de rôle ici sinon expliciter
    }
  ) => {
    log("/controllers/chauffeur.controller.ts");
    log("🔵 UPDATE CHAUFFEUR FUNCTION");
    // s'assure que la cible est bien un CHAUFFEUR
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CHAUFFEUR") {
      throw new Error("Utilisateur non trouvé ou n'est pas un chauffeur");
    }
    
    // Strip id from data to avoid Prisma error
    const { id: _, ...updateData } = data;
    
    // Process images
    const dataToUpdate: any = { ...updateData };
    if (data.image) {
       dataToUpdate.image = saveImage(data.image);
    }
    if (data.licenseImage) {
       dataToUpdate.licenseImage = saveImage(data.licenseImage);
    }
    
    // Hash password if present
    if (data.password) {
      log("🔵 Hashing new password for chauffeur update");
      const bcrypt = await import('bcryptjs');
      dataToUpdate.password = await bcrypt.hash(data.password, 10);
    }

    log("🔵 Starting to update user:", { id, data: dataToUpdate });
    return await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
  },

  // Suppression d'un chauffeur (user)
  delete: async (id: string) => {
    log("/controllers/chauffeur.controller.ts");
    log("🔵 DELETE CHAUFFEUR FUNCTION");
    log("🔵 Starting to delete user:", { id });
    // s'assure que la cible est bien un CHAUFFEUR
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CHAUFFEUR") {
      throw new Error("Utilisateur non trouvé ou n'est pas un chauffeur");
    }
    return await prisma.user.delete({
      where: { id },
    });
  },

  // Calcul du coût total pour un chauffeur (user) sur une période.
  
  bloqueAccess: async (id: string) => {
    log("/controllers/chauffeur.controller.ts");
    log("🔵 BLOCK ACCESS CHAUFFEUR FUNCTION");
    log("🔵 Starting to block access for user:", { id });
    // s'assure que la cible est bien un CHAUFFEUR
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CHAUFFEUR") {
      throw new Error("Utilisateur non trouvé ou n'est pas un chauffeur");
    }
    return await prisma.user.update({
      where: { id },
      data: { organizationAccess: false },
    });
  },
};
