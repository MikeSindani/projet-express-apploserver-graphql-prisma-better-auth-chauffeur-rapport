import log from '@/lib/log';
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
      log("/controllers/organisation.controller.ts");
      log("🔵 getOrganizationUser function");
      log(" 🔵 Started to get organization user",{userId})
     const user = await prisma.user.findUnique({ where: { id: userId } });
     if (!user) {
       throw new Error(`User with id ${userId} not found`);
     }
     log(" 🔵 User found",{user})
     if (!user?.organizationId) {
       throw new Error(`User with id ${userId} is not associated with an organization`);
     }
     return await prisma.organization.findUnique({
       where: { id: user?.organizationId },
     });
  },
  createOrganization: async (name: string, userId?: string) => {
    log("/controllers/organisation.controller.ts");
    log("🔵 createOrganization function");
    log(" 🔵 Started to create organization",{name,userId})
    const org = await prisma.organization.create({
      data: { name },
    });
    log(" 🔵 Organization created",{org})
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
  addUserToOrganization: async (organizationId: string, email?: string, telephone?: string) => {
    log("/controllers/organisation.controller.ts");
    log("🔵 addUserToOrganization function");
    log(" 🔵 Started to add user to organization",{email,organizationId})

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

    log(" 🔵 User found",{user})

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

  manageOrganizationAccess: async (userId: string, access: boolean, managerOrgId?: string) => {
    log("/controllers/organisation.controller.ts");
    log("🔵 manageOrganizationAccess function", { userId, access, managerOrgId });

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true }
    });

    if (!user) {
      throw new Error(`Utilisateur avec l'ID ${userId} non trouvé.`);
    }

    // 2. Security Check: If managerOrgId is provided, verify it matches user's organization
    // Managers should only be able to manage access for users in their own organization
    if (managerOrgId && user.organizationId !== managerOrgId) {
      log("❌ Security Violation: Manager tried to access user outside their organization", { managerOrgId, userOrgId: user.organizationId });
      throw new Error("Vous n'avez pas l'autorisation de gérer l'accès de cet utilisateur.");
    }

    log("🔵 Managing access", { userId, access });
    return await prisma.user.update({
      where: { id: userId },
      data: { organizationAccess: access }
    });
  },

  getOrganizationMembers: async (organizationId: string) => {
    log("/controllers/organisation.controller.ts");
    log("🔵 getOrganizationMembers function",{organizationId});
      return await prisma.user.findMany({
          where: { organizationId }
      });
  },
  
};
