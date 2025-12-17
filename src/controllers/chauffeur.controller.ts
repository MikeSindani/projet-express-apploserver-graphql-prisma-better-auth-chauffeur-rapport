import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/saveImage";




export const ChauffeurController = {
  // Liste de tous les users de rôle CHAUFFEUR
  getAll: async () => {
    console.log("/controllers/chauffeur.controller.ts");
    console.log("🔵 GET ALL CHAUFFEUR FUNCTION");
    console.log("🔵 Starting to get all chauffeurs");
    return await prisma.user.findMany({
      where: { role: "CHAUFFEUR" },
      include: {
        // ... ajuste selon ton schéma: relations éventuelles liées au user
        vehicules: true,
      },
    });
  },

  // Un seul chauffeur (user) par id — garantit role = CHAUFFEUR
  getOne: async (id: string) => {
    console.log("/controllers/chauffeur.controller.ts");
    console.log("🔵 GET ONE CHAUFFEUR FUNCTION");
    console.log("🔵 Starting to get one chauffeur", { id });
    return await prisma.user.findFirst({
      where: { id, role: "CHAUFFEUR" },
      include: {
        vehicules: true,
      },
    });
  },

  create: async (data: any) => {
    console.log("/controllers/chauffeur.controller.ts");
    console.log("🔵 CREATE CHAUFFEUR FUNCTION");
    
    const { name, email, password, role, telephone, licenseNumber, organizationId, image } = data;
    console.log("🔵 Starting to create user:", { name, email, password, role, telephone, licenseNumber, organizationId, imageLen: image?.length });
    
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
    
    console.log("🔵 User does not exist, creating...");
    
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
      console.log("🔵 User created successfully with email, updating...");
      
      // Update user with Chauffeur specific data
      const user = await prisma.user.update({
        where: { email },
        data: {
          role: "CHAUFFEUR",
          telephone,
          licenseNumber,
          organizationId,
          organizationAccess: true,
          image: image ? saveImage(image) : undefined,
        },
      });
      console.log("🔵 User updated successfully:", user);
      return user;
    } else {
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
      } catch (error) {
        console.error("❌ Better-auth signup failed:", error);
        throw error;
      }
      console.log("🔵 User created successfully with phone, updating...");
       // Update user with Chauffeur specific data
      // We use generatedEmail to find the user we just created
      const user = await prisma.user.update({
        where: { email: generatedEmail },
        data: {
          role: "CHAUFFEUR",
          telephone,
          licenseNumber,
          organizationId,
          organizationAccess: true,
          image: image ? saveImage(image) : undefined,
        },
      });
      console.log("🔵 User created successfully with phone:", user);
      return user;
    }
  },

  // Mise à jour d'un chauffeur (user)
  update: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      telephone?: string;
      licenseNumber?: string;
      organizationId?: string;
      organizationAccess?: boolean;
      image?: string;
      // ne pas autoriser le changement de rôle ici sinon expliciter
    }
  ) => {
    console.log("/controllers/chauffeur.controller.ts");
    console.log("🔵 UPDATE CHAUFFEUR FUNCTION");
    // s'assure que la cible est bien un CHAUFFEUR
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CHAUFFEUR") {
      throw new Error("Utilisateur non trouvé ou n'est pas un chauffeur");
    }
    
    // Process image if present
    const dataToUpdate: any = { ...data };
    if (data.image) {
       dataToUpdate.image = saveImage(data.image);
    }

    console.log("🔵 Starting to update user:", { id, data: dataToUpdate });
    return await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
  },

  // Suppression d'un chauffeur (user)
  delete: async (id: string) => {
    console.log("/controllers/chauffeur.controller.ts");
    console.log("🔵 DELETE CHAUFFEUR FUNCTION");
    console.log("🔵 Starting to delete user:", { id });
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
  // Suppose l'existence d'un modèle "trajet" avec champs { chauffeurId, cout, date }.
  count: async (organizationId?: string) => {
    console.log("/controllers/chauffeur.controller.ts"); 
    console.log("🔵 COUNT CHAUFFEUR FUNCTION");
    console.log("🔵 Starting to count chauffeurs", { organizationId });
    if (organizationId) {
      const count = await prisma.user.count({ 
        where: { 
          role: "CHAUFFEUR",
          organizationId 
        } 
      });
      console.log("🔵 Count chauffeurs successfully:", { count });
      return count;
    }
    console.log("🔵 Count chauffeurs successfully : 0 ");
    return 0
  },
  bloqueAccess: async (id: string) => {
    console.log("/controllers/chauffeur.controller.ts");
    console.log("🔵 BLOCK ACCESS CHAUFFEUR FUNCTION");
    console.log("🔵 Starting to block access for user:", { id });
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
