import { AuthController } from '@/controllers/auth.controller';
import { ChauffeurController } from '@/controllers/chauffeur.controller';
import { NotificationController } from '@/controllers/notification.controller';
import { OrganizationController } from '@/controllers/organisation.controller';
import { RapportController } from '@/controllers/rapport.controller';
import { SearchController } from '@/controllers/search.controller';
import { UserController } from '@/controllers/users.controller';
import { VehiculeController } from '@/controllers/vehicules.controller';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLUpload } from 'graphql-upload-ts';
// removed unused/invalid import from better-auth


const pubsub = new PubSub<Record<string, any>>();
const NOTIF_EVENT = 'NOTIFICATION_RECEIVED';


async function sendNotification(message : string, organizationId: string) {
      // Persist for all managers in the organization
      await NotificationController.createForOrganization(organizationId, message);

      const notif = {
        id: Date.now().toString(),
        message,
        timestamp: new Date().toISOString(),
        read: false
      };
      pubsub.publish(NOTIF_EVENT, { notificationReceived: notif });
      return notif;
    }

const checkAuth = (context: any) => {
  if (!context.user) {
    throw new Error('Not authenticated');
  }
};

const checkGestionnaire = (context: any) => {
  if (!context.user || context.user.role !== 'GESTIONNAIRE') {
    throw new Error('Not authorized ');
  }
};

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
      checkAuth(context);
      return RapportController.getAll();
    },
    rapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      return RapportController.getOne(args.id);
    },

    chauffeurs: (_: any, __: any, context: any) => {
      checkGestionnaire(context);
      return ChauffeurController.getAll();
    },
    chauffeur: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return ChauffeurController.getOne(args.id);
    },

    vehicules: (_: any, __: any, context: any) => {
      checkAuth(context);
      return VehiculeController.getAll();
    },
    vehicule: (_: any, args: any, context: any) => {
      checkAuth(context);
      return VehiculeController.getOne(args.id);
    },

    countChauffeur: (_: any, args: any, context: any) => {
      checkAuth(context);
      const organizationId = args.organizationId || context.user?.organizationId;
      return ChauffeurController.count(organizationId);
    },
    countVehicule: (_: any, args: any, context: any) => {
      checkAuth(context);
      const organizationId = args.organizationId || context.user?.organizationId;
      return VehiculeController.count(organizationId);
    },
    countActiveVehicule: (_: any, args: any, context: any) => {
      checkAuth(context);
      const organizationId = args.organizationId || context.user?.organizationId;
      return VehiculeController.count(organizationId, 'Disponible');
    },
    countRapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      const organizationId = args.organizationId || context.user?.organizationId;
      return RapportController.count(organizationId);
    },
    getOrganizationUser: (_: any, args: any, context: any) => {
      checkAuth(context);
      return  OrganizationController.getOrganizationUser(args.userId);
    },
    organizationMembers: (_: any, args: any, context: any) => {
      checkAuth(context);
      return OrganizationController.getOrganizationMembers(args.organizationId);
    },
    search: (_: any, args: any, context: any) => {
      checkAuth(context);
      const organizationId = args.organizationId || context.user?.organizationId;
      return SearchController.searchAll(args.query, organizationId);
    },
    notifications: (_: any, __: any, context: any) => {
      checkAuth(context);
      return NotificationController.getUserNotifications(context.user.id);
    },
  },
  Mutation: {
    login: (_: any, args: any) => AuthController.login(_, args),
    loginWithPhone: (_: any, args: any) => AuthController.loginWithPhone(_, args),
    register: (_: any, args: any) => AuthController.register(_, args),
    registerWithPhone: (_: any, args: any) => AuthController.registerWithPhone(_, args),
    forgotPassword: (_: any, args: any) => AuthController.forgotPassword(args.email),
    forgotPasswordWithPhone: (_: any, args: any) => AuthController.forgotPasswordWithPhone(args.telephone),
    logout: (_: any, args: any, context: any) => AuthController.logout(args.token),
    generateToken : (_: any, args: any, context: any) => {
      checkAuth(context);
      return AuthController.generateToken(args.userId);
    },
    updateProfile: (_: any, args: any, context: any) => {
      checkAuth(context);
      return AuthController.updateProfile({ userId: args.id, data: args });
    },
    

    createVehicule: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return VehiculeController.create(args);
    },
    updateVehicule: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return VehiculeController.update(args, args.id);
    },


    createOrganization: (_: any, args: any, context: any) => {
      checkAuth(context);
      return  OrganizationController.createOrganization(args.name, args.userId);
    },

    addUserToOrganization: (_: any, args: any, context: any) => {
      checkAuth(context);
      return  OrganizationController.addUserToOrganization(args.email, args.organizationId, args.telephone);
    },

    manageOrganizationAccess: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return OrganizationController.manageOrganizationAccess(args.userId, args.access);
    },



    createRapport: async (_: any, args: any, context: any) => {
      checkAuth(context);
      const rapport = await RapportController.create(args);
      
      // Trigger notification for new report
      if (rapport.organizationId) {
          await sendNotification(`Nouveau rapport créé - ${rapport.id}`, rapport.organizationId);
      }
      
      return rapport;
    },
    updateRapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      return RapportController.update(args, args.id);
    },
    deleteRapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      return RapportController.delete(args.id);
    },
    
    
    createChauffeur: async (_: any, args: any, context: any) => {
      console.log("🔵 createChauffeur resolver called");
      console.log("🔵 Args:", JSON.stringify(args, null, 2));
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
      
      return updatedChauffeur;
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
  },
  Subscription: {
    notificationReceived: {
      subscribe: () => pubsub.asyncIterableIterator([NOTIF_EVENT]),
    },
  },
  Upload: GraphQLUpload,
};
