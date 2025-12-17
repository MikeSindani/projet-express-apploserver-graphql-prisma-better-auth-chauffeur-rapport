import { prisma } from "@/lib/prisma";

type AuthArgs = {
  email: string;
  motDePasse: string;
  role?: "GESTIONNAIRE" | "CHAUFFEUR";
};

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // ou ta clé publique si RS256

export const UserController = {
  users: async () => {
     console.log("🔵 Starting to get all users");
    return await prisma.user.findMany({
      include: {
        organization: true,
        vehicules: true,
      },
    });
  },

  user: async (id: string) => {
    console.log("🔵 Starting to get user by id:", { id });
    return await prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        vehicules: true,
      },
    });
  },
  
  update: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: "GESTIONNAIRE" | "CHAUFFEUR";
    }
  ) => {
    console.log("🔵 Starting to update user by id:", { id });
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        organization: true,
        vehicules: true,
      },
    });
  },

  delete: async (id: string) => {
    console.log("🔵 Starting to delete user by id:", { id });
    return await prisma.user.delete({
      where: { id },
    });
  },
  
  updateUser: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: "GESTIONNAIRE" | "CHAUFFEUR" | "ADMIN";
      organizationId?: string;
      organizationAccess?: boolean;
      telephone?: string;
      licenseNumber?: string;
    }
  ) => {
    console.log("🔵 Starting to update user by id:", { id });
    return await prisma.user.update({
      where: { id },
      data,
    });
  },
};
