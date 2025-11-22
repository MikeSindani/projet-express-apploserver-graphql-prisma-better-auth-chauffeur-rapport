import { AuthController } from '@/controllers/auth.controller';
import { ChauffeurController } from '@/controllers/chauffeur.controller';
import { RapportController } from '@/controllers/rapport.controller';
import { UserController } from '@/controllers/users.controller';
import { VehiculeController } from '@/controllers/vehicules.controller';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLUpload } from 'graphql-upload-ts';
// removed unused/invalid import from better-auth


const pubsub = new PubSub<Record<string, any>>();
const NOTIF_EVENT = 'NOTIFICATION_RECEIVED';


function sendNotification(message : string) {
      const notif = {
        id: Date.now().toString(),
        message,
        timestamp: new Date().toISOString(),
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
      checkGestionnaire(context);
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

    countChauffeur: (_: any, __: any, context: any) => {
      checkAuth(context);
      return ChauffeurController.count();
    },
    countVehicule: (_: any, __: any, context: any) => {
      checkAuth(context);
      return VehiculeController.count();
    },
    countRapport: (_: any, __: any, context: any) => {
      checkAuth(context);
      return RapportController.count();
    },
  },
  Mutation: {
    login: (_: any, args: any) => AuthController.login(_, args),
    register: (_: any, args: any) => AuthController.register(_, args),
    forgotPassword: (_: any, args: any) => AuthController.forgotPassword(args.email),
    logout: (_: any, args: any) => AuthController.logout(args.token),
    generateToken : (_: any, args: any, context: any) => {
      checkAuth(context);
      return AuthController.generateToken(args.userId);
    },
    

    createVehicule: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return VehiculeController.create(args);
    },
    updateVehicule: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return VehiculeController.update(args, args.id);
    },
    deleteVehicule: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return VehiculeController.delete(args.id);
    },

    
    updateUser: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return UserController.update(args, args.id);
    },
    deleteUser: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return UserController.delete(args.id);
    },

    createOrganization: (_: any, args: any, context: any) => {
      checkAuth(context);
      return UserController.createOrganization(args.name, args.userId);
    },

    createRapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      return RapportController.create(args);
    },
    updateRapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      return RapportController.update(args, args.id);
    },
    deleteRapport: (_: any, args: any, context: any) => {
      checkAuth(context);
      return RapportController.delete(args.id);
    },

    
    updateChauffeur: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return ChauffeurController.update(args.id, args);
    },
    deleteChauffeur: (_: any, args: any, context: any) => {
      checkGestionnaire(context);
      return ChauffeurController.delete(args.id);
    },

    sendNotification: (_ : any, { message }: { message: string }, context: any) => {
      checkAuth(context);
      return sendNotification(message);
    },
  },
  Subscription: {
    notificationReceived: {
      subscribe: () => (pubsub as any).asyncIterator([NOTIF_EVENT]),
    },
  },
  Upload: GraphQLUpload,
};
