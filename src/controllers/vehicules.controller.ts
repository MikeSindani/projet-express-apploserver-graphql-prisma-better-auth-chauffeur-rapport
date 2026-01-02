import log from '@/lib/log';
import { prisma } from '@/lib/prisma';

export const VehiculeController = {
  count : async (organizationId?: number, statut?: string) => {  
    log('/controllers/vehicules.controller.ts')
    log("🔵 count function", { organizationId, statut }); 
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (statut) where.statut = statut;
    
    return await prisma.vehicule.count({ where });
  },
  countIndisponible : async (organizationId?: number) => {  
    log('/controllers/vehicules.controller.ts')
    log("🔵 countIndisponible function", { organizationId }); 
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    where.statut = 'Indisponible';
    
    return await prisma.vehicule.count({ where });
  },
  getAll: async () => {
    log('/controllers/vehicules.controller.ts')
    log("🔵 getAll function")
    return await prisma.vehicule.findMany({
      include: {
        rapports: true,
        user: true,
        driver: true,
      },
    });
  },

  getOne: async (id: number) => {
    log('/controllers/vehicules.controller.ts')
    log("🔵 getOne function", { id });
    return await prisma.vehicule.findUnique({
      where: { id },
      include: {
        rapports: true,
        user: true,
        driver: true,
      },
    });
  },

  create: async ({
    immatriculation,
    marque,
    modele,
    annee,
    statut,
    userId,
    driverId,
    image,
    registrationCardImage,
  }: {
    immatriculation: string;
    marque: string;
    modele: string;
    annee: number;
    statut?: string;
    userId: string;
    driverId?: string;
    image?: string;
    registrationCardImage?: string;
  }) => {
    log('/controllers/vehicules.controller.ts')
    log("🔵 create function", { immatriculation, marque, modele, annee, statut, userId, driverId });
    // Attach organizationId from the owning user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`Utilisateur avec l'ID ${userId} n'existe pas`);
    if (!user.organizationId) throw new Error('user.organizationId is required to create a vehicule');

    const { saveImage } = await import('@/lib/saveImage');

    return await prisma.vehicule.create({
      data: {
        immatriculation,
        marque,
        modele,
        annee,
        statut: statut ?? 'Disponible',
        userId,
        driverId,
        image: image ? saveImage(image) : undefined,
        registrationCardImage: registrationCardImage ? saveImage(registrationCardImage) : undefined,
        organizationId: user.organizationId,
      },
      include: {
        driver: true,
        user: true,
      }
    });
  },

  update: async (
    id: number,
    data: {
      immatriculation?: string;
      marque?: string;
      modele?: string;
      annee?: number;
      statut?: string;
    }
  ) => {
    log('/controllers/vehicules.controller.ts')
    log("🔵 update function", { id, data });
    return await prisma.vehicule.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    log('/controllers/vehicules.controller.ts')
    log("🔵 delete function", { id });
    return await prisma.vehicule.delete({
      where: { id },
    });
  },
  changeStatut: async (id: number, statut: string) => {
    log('/controllers/vehicules.controller.ts')
    log("🔵 changeStatut function", { id, statut });
    return await prisma.vehicule.update({
      where: { id },
      data: { statut },
    });
  },
};
