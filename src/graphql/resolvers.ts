import { AuthController } from '@/controllers/auth.controller';
import { ChauffeurController } from '@/controllers/chauffeur.controller';
import { NotificationController } from '@/controllers/notification.controller';
import { OrganizationController } from '@/controllers/organisation.controller';
import { RapportController } from '@/controllers/rapport.controller';
import { SearchController } from '@/controllers/search.controller';
import { UploadController } from '@/controllers/upload.controller';
import { UserController } from '@/controllers/users.controller';
import { VehiculeController } from '@/controllers/vehicules.controller';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/services/notification.service';
import { checkAuth, checkGestionnaire, checkOrganization } from '@/utils/auth';


const NOTIF_EVENT = 'NOTIFICATION_RECEIVED';


async function sendNotification(message: string, organizationId: string, pubsub: any, options?: { email?: string, sms?: string }) {
  // Persist for all managers in the organization
  const notif = await NotificationController.createForOrganization(organizationId, message);

  if (pubsub) {
    pubsub.publish(NOTIF_EVENT, { notificationReceived: notif });
    pubsub.publish('STATS_UPDATED', { statsUpdated: true });
  }

  // Example: Send external notifications if options provided
  if (options?.email) {
    await NotificationService.sendEmail(options.email, 'Nouvelle Notification FleetManager', `<p>${message}</p>`);
  }
  if (options?.sms) {
    await NotificationService.sendSMS(options.sms, message);
  }
  
  return notif;
}


export const resolvers = {
  Query: {
    users: (_: any, __: any, context: any) => {
      checkGestionnaire(context);
      return UserController.users();
    },
    user: (_: any, args: any, context: any) => {
      checkAuth(context);
      return UserController.user(args.id);
    },

    rapports: (_: any, __: any, context: any) => {
      checkOrganization(context);
      
      const isChauffeur = context.user.role === 'CHAUFFEUR';
      // If chauffeur, only show their own reports. If manager, show all in org.
      return RapportController.getAll(
        context.user.organizationId, 
        isChauffeur ? context.user.id : undefined
      );
    },
    rapport: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return RapportController.getOne(args.id, context.user.organizationId);
    },

    chauffeurs: (_: any, __: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return ChauffeurController.getAll(context.user.organizationId);
    },
    chauffeur: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return ChauffeurController.getOne(args.id, context.user.organizationId);
    },

    vehicules: (_: any, __: any, context: any) => {
      checkOrganization(context);
      return VehiculeController.getAll(context.user.organizationId);
    },
    vehicule: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return VehiculeController.getOne(args.id, context.user.organizationId);
    },

    countChauffeur: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return ChauffeurController.count(context.user.organizationId);
    },
    countVehicule: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return VehiculeController.count(context.user.organizationId);
    },
    countActiveVehicule: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return VehiculeController.count(context.user.organizationId, 'Disponible');
    },
    countIndisponibleVehicule: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return VehiculeController.countIndisponible(context.user.organizationId);
    },
    countRapport: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return RapportController.count(context.user.organizationId);
    },
    getOrganizationUser: (_: any, args: any, context: any) => {
      checkAuth(context);
      return OrganizationController.getOrganizationUser(args.userId);
    },
    organizationMembers: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return OrganizationController.getOrganizationMembers(context.user.organizationId);
    },
    search: (_: any, args: any, context: any) => {
      checkAuth(context)
        return SearchController.searchAll(args.query, context.user.organizationId,checkGestionnaire(context));
    },
    notifications: (_: any, __: any, context: any) => {
      checkAuth(context);
      return NotificationController.getUserNotifications(context.user.id);
    },
  },

  Mutation: {
    // ... existing mutations


    login: (_: any, args: any) => AuthController.login(_, args),
    loginWithPhone: (_: any, args: any) => AuthController.loginWithPhone(_, args),
    register: (_: any, args: any) => AuthController.register(_, args),
    registerWithPhone: (_: any, args: any) => AuthController.registerWithPhone(_, args),
    changePassword: (_: any, args: any, context: any) => {
      checkAuth(context);
      return AuthController.changePassword(context?.user?.id, args)
    },
    forgotPassword: (_: any, args: any) => AuthController.forgotPassword(args.email),
    forgotPasswordWithPhone: (_: any, args: any) => AuthController.forgotPasswordWithPhone(args.telephone),
    logout: (_: any, args: any, context: any) => AuthController.logout(args.token, context.request.headers),
    generateToken: (_: any, args: any, context: any) => {
      checkAuth(context);
      return AuthController.generateToken(args.userId);
    },
    updateProfile: (_: any, args: any, context: any) => {
      checkAuth(context);
      return AuthController.updateProfile({ userId: args.id, data: args });
    },


    createVehicule: async (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      const vehicule = await VehiculeController.create(args);
      
      // Trigger notification for new vehicle
      if (context.user?.organizationId) {
        await sendNotification(
          `Nouveau véhicule ajouté : ${args.marque} ${args.modele} (${args.immatriculation})`, 
          context.user.organizationId,
          context.pubsub
        );
        context.pubsub.publish('VEHICULE_CREATED', { vehiculeCreated: vehicule });
      }
      
      return vehicule;
    },
    updateVehicule: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return VehiculeController.update(args, args.id);
    },
    deleteVehicule: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return VehiculeController.delete(args.id);
    },
    changeStatut: async (_: any, args: any, context: any) => {
      checkOrganization(context);
      // Allow if manager OR if chauffeur is the assigned driver
      const vehicule = await VehiculeController.getOne(args.id, context.user.organizationId);
      const isManager = context.user.role === 'GESTIONNAIRE';
      const isAssignedDriver = context.user.role === 'CHAUFFEUR' && vehicule?.driverId === context.user.id;

      if (!isManager && !isAssignedDriver) {
        throw new Error('Non autorisé à modifier le statut de ce véhicule');
      }

      const updated = await VehiculeController.changeStatut(args.id, args.statut);
      
      if (context.pubsub) {
        context.pubsub.publish('VEHICULE_UPDATED', { vehiculeUpdated: updated });
        context.pubsub.publish('STATS_UPDATED', { statsUpdated: true });
      }

      return updated;
    },


    createOrganization: (_: any, args: any, context: any) => {
      checkAuth(context);
      return OrganizationController.createOrganization(args.name, args.userId);
    },

    addUserToOrganization: (_: any, args: any, context: any) => {
      checkAuth(context);
      return OrganizationController.addUserToOrganization(args.organizationId, args.email, args.telephone);
    },

    manageOrganizationAccess: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return OrganizationController.manageOrganizationAccess(args.userId, args.access, context.user?.organizationId);
    },



    createRapport: async (_: any, args: any, context: any) => {
      checkOrganization(context);
      const rapport = await RapportController.create(args);

      // Trigger notification for new report
      if (rapport.organizationId) {
        await sendNotification(`Nouveau rapport créé - ${rapport.id}`, rapport.organizationId, context.pubsub);
        context.pubsub.publish('RAPPORT_CREATED', { rapportCreated: rapport });
      }

      return rapport;
    },
    updateRapport: (_: any, args: any, context: any) => {
      checkOrganization(context);

      return RapportController.update(args, args.id);
    },
    deleteRapport: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return RapportController.delete(args.id);
    },


    createChauffeur: async (_: any, args: any, context: any) => {
     
      checkOrganization(context);
      checkGestionnaire(context);

      // Get the organization ID from the authenticated user
      const organizationId = context.user?.organizationId;
      if (!organizationId) {
        throw new Error('Vous devez appartenir à une organisation pour ajouter un chauffeur');
      }

      // Create the chauffeur
      const chauffeur = await ChauffeurController.create(args);

      // Assign to the manager's organization with pending access
      const updatedChauffeur = await UserController.updateUser(chauffeur.id, {
        organizationId,
        organizationAccess: true, // Auto-approve since manager is creating
      });

      // Trigger notification for new chauffeur
      await sendNotification(`Nouveau chauffeur ajouté : ${args.name}`, organizationId, context.pubsub);

      return updatedChauffeur;
    },
    updateChauffeur: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return ChauffeurController.update(args.id, args);
    },
    deleteChauffeur: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return ChauffeurController.delete(args.id);
    },
    bloqueAccess: (_: any, args: any, context: any) => {
      checkOrganization(context);
      checkGestionnaire(context);
      return ChauffeurController.bloqueAccess(args.id);
    },
  


    markAllNotificationsAsRead: async (_: any, args: any, context: any) => {
      checkAuth(context);
      await NotificationController.markAllAsRead(context.user.id);
      return true;
    },

    markNotificationAsRead: async (_: any, args: any, context: any) => {
      checkAuth(context);
      return await NotificationController.markAsRead(args.id, context.user.id);
    },


    uploadFile: async (_: any, args: any, context: any) => {
      //checkAuth(context);
      return UploadController.uploadFile(args.file, args.folder, context.user?.organizationId || 'default');
    },

    sendNotification: (_: any, args: any, context: any) => {
      checkOrganization(context);
      return sendNotification(args.message, context.user.organizationId, context.pubsub);
    },
  },
  Subscription: {
    notificationReceived: {
      subscribe: (_: any, __: any, context: any) => context.pubsub.subscribe(NOTIF_EVENT),
      resolve: (payload: any) => payload.notificationReceived,
    },
    rapportCreated: {
      subscribe: (_: any, __: any, context: any) => context.pubsub.subscribe('RAPPORT_CREATED'),
      resolve: (payload: any) => payload.rapportCreated,
    },
    vehiculeUpdated: {
      subscribe: (_: any, __: any, context: any) => context.pubsub.subscribe('VEHICULE_UPDATED'),
      resolve: (payload: any) => payload.vehiculeUpdated,
    },
    vehiculeCreated: {
      subscribe: (_: any, __: any, context: any) => context.pubsub.subscribe('VEHICULE_CREATED'),
      resolve: (payload: any) => payload.vehiculeCreated,
    },
    statsUpdated: {
      subscribe: (_: any, __: any, context: any) => context.pubsub.subscribe('STATS_UPDATED'),
      resolve: (payload: any) => payload.statsUpdated,
    },
  },
  Vehicule: {
    images: (parent: any) => {
      return prisma.vehiculeImage.findMany({
        where: { vehiculeId: parent.id }
      });
    }
  },
  Rapport: {
    chauffeurId: (parent: any) => parent.userId,
    images: (parent: any) => {
      return prisma.rapportImage.findMany({
        where: { rapportId: parent.id }
      });
    }
  }
};
