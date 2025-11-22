import { prisma } from '@/lib/prisma'; // adapte ce chemin à ton projet

export const VehiculeController = {
  count : async () => {   
    return await prisma.vehicule.count();
  },
  getAll: async () => {
    return await prisma.vehicule.findMany({
      include: {
        rapports: true,
        user: true,
      },
    });
  },

  getOne: async (id: number) => {
    return await prisma.vehicule.findUnique({
      where: { id },
      include: {
        rapports: true,
        user: true,
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
  }: {
    immatriculation: string;
    marque: string;
    modele: string;
    annee: number;
    statut?: string;
    userId: string;
  }) => {
    // Attach organizationId from the owning user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`Utilisateur avec l'ID ${userId} n'existe pas`);
    if (!user.organizationId) throw new Error('user.organizationId is required to create a vehicule');

    return await prisma.vehicule.create({
      data: {
        immatriculation,
        marque,
        modele,
        annee,
        statut: statut ?? 'Disponible',
        userId,
        organizationId: user.organizationId,
      },
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
    return await prisma.vehicule.update({
      where: { id },
      data,
    });
  },

  delete: async (id: number) => {
    return await prisma.vehicule.delete({
      where: { id },
    });
  },
};
