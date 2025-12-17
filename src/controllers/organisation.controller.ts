import { prisma } from "@/lib/prisma";

type AuthArgs = {
  name: string;
  email: string;
  password: string;
  role?: "GESTIONNAIRE" | "CHAUFFEUR";
};

const JWT_SECRET = process.env.JWT_SECRET || "TON_SECRET_JWT";

export const OrganizationController = {

    getOrganizationUser: async (userId: string) => {
      console.log("/controllers/organisation.controller.ts");
      console.log("🔵 getOrganizationUser function");
      console.log(" 🔵 Started to get organization user",{userId})
     const user = await prisma.user.findUnique({ where: { id: userId } });
     if (!user) {
       throw new Error(`User with id ${userId} not found`);
     }
     console.log(" 🔵 User found",{user})
     if (!user?.organizationId) {
       throw new Error(`User with id ${userId} is not associated with an organization`);
     }
     return await prisma.organization.findUnique({
       where: { id: user?.organizationId },
     });
  },
  createOrganization: async (name: string, userId?: string) => {
    console.log("/controllers/organisation.controller.ts");
    console.log("🔵 createOrganization function");
    console.log(" 🔵 Started to create organization",{name,userId})
    const org = await prisma.organization.create({
      data: { name },
    });
    console.log(" 🔵 Organization created",{org})
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          organizationId: org.id,
          role: 'GESTIONNAIRE', // Ensure the creator is a manager
          organizationAccess: true
        },
      });
    }
    return org;
  },
  addUserToOrganization: async (email?: string, organizationId: string, telephone?: string) => {
    console.log("/controllers/organisation.controller.ts");
    console.log("🔵 addUserToOrganization function");
    console.log(" 🔵 Started to add user to organization",{email,organizationId})

    // Find the user first
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (telephone) {
       user = await prisma.user.findUnique({ where: { telephone } });
    }

    if (!user) {
      throw new Error(`User not found`);
    }

    console.log(" 🔵 User found",{user})

    // Update user with organizationId but access false (Pending)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        organizationId,
        organizationAccess: false 
      },
    });

    // Notify organization managers
    const { NotificationController } = require('./notification.controller'); // Dynamic import to avoid circular dependency if any
    await NotificationController.createForOrganization(
      organizationId,
      `Nouvelle demande d'adhésion de ${user.name || user.email || user.telephone}`
    );

    return updatedUser;
  },

  manageOrganizationAccess: async (userId: string, access: boolean) => {
    console.log("/controllers/organisation.controller.ts");
    console.log("🔵 manageOrganizationAccess function");
      console.log(" 🔵 Managing access", { userId, access });
      return await prisma.user.update({
          where: { id: userId },
          data: { organizationAccess: access }
      });
  },

  getOrganizationMembers: async (organizationId: string) => {
    console.log("/controllers/organisation.controller.ts");
    console.log("🔵 getOrganizationMembers function");
      return await prisma.user.findMany({
          where: { organizationId }
      });
  },
  
};
