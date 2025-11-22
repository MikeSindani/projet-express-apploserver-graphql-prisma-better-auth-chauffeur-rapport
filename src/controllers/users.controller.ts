import { prisma } from "@/lib/prisma";

type AuthArgs = {
  email: string;
  motDePasse: string;
  role?: "GESTIONNAIRE" | "CHAUFFEUR";
};

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // ou ta clé publique si RS256

export const UserController = {
  users: async () => {
    return await prisma.user.findMany({
      include: {
        vehicules: true,
      },
    });
  },

  user: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      include: {
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
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.user.delete({
      where: { id },
    });
  },

  createOrganization: async (name: string, userId?: string) => {
    const org = await prisma.organization.create({
      data: { name },
    });
    
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: org.id },
      });
    }
    
    return org;
  },
};
