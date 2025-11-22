import { prisma } from '@/lib/prisma';

export const RapportController = {
  count : async () => {   
    return await prisma.rapport.count();
  },
  getAll: async () => {
    return await prisma.rapport.findMany({
      include: {
        vehicule: true,
      },
    });
  },

  getOne: async (id: number) => {
    return await prisma.rapport.findUnique({
      where: { id },
      include: {
        vehicule: true,
      },
    });
  },

  create: async ({
    date,
    kilometrage,
    incidents,
    commentaires,
    chauffeurId,
    vehiculeId,
  }: {
    date?: Date;
    kilometrage: number;
    incidents?: string;
    commentaires?: string;
    chauffeurId: string;
    vehiculeId: number;
  }) => {
    // Vérifier si le chauffeur et le véhicule existent
    const chauffeur = await prisma.user.findUnique({ where: { id: chauffeurId } });
    const vehicule = await prisma.vehicule.findUnique({ where: { id: vehiculeId } });

    if (!chauffeur) {
      throw new Error(`Chauffeur avec l'ID ${chauffeurId} n'existe pas`);
    }

    if (!vehicule) {
      throw new Error(`Véhicule avec l'ID ${vehiculeId} n'existe pas`);
    }
    // Determine organizationId for the rapport (prefer chauffeur's organization if available)
    const organizationId = (chauffeur as any).organizationId ?? (vehicule as any).organizationId;
    if (!organizationId) throw new Error('Unable to determine organizationId for rapport creation');

    return await prisma.rapport.create({
      data: {
        date: date || new Date(),
        kilometrage,
        incidents: incidents ?? null,
        commentaires: commentaires ?? null,
        userId: chauffeurId,
        chauffeurId,
        organizationId,
        vehiculeId,
      },
      include: {
        vehicule: true,
      },
    });
  },

  update: async (
    {
      date,
      kilometrage,
      incidents,
      commentaires,
      chauffeurId,
      vehiculeId,
    }: {
      date?: Date;
      kilometrage?: number;
      incidents?: string;
      commentaires?: string;
      chauffeurId?: string;
      vehiculeId?: number;
    },
    id: number
  ) => {
    // Vérifier si le rapport existe
    const existingRapport = await prisma.rapport.findUnique({ where: { id } });
    if (!existingRapport) {
      throw new Error(`Rapport avec l'ID ${id} n'existe pas`);
    }

    // Vérifier les relations si elles sont mises à jour
    if (chauffeurId) {
      const chauffeur = await prisma.user.findUnique({ where: { id: chauffeurId } });
      if (!chauffeur) {
        throw new Error(`Chauffeur avec l'ID ${chauffeurId} n'existe pas`);
      }
    }

    if (vehiculeId) {
      const vehicule = await prisma.vehicule.findUnique({ where: { id: vehiculeId } });
      if (!vehicule) {
        throw new Error(`Véhicule avec l'ID ${vehiculeId} n'existe pas`);
      }
    }
    const updateData: any = {};
    if (typeof date !== 'undefined') updateData.date = date;
    if (typeof kilometrage !== 'undefined') updateData.kilometrage = kilometrage;
    if (typeof incidents !== 'undefined') updateData.incidents = incidents;
    if (typeof commentaires !== 'undefined') updateData.commentaires = commentaires;
    if (typeof chauffeurId !== 'undefined') updateData.chauffeurId = chauffeurId;
    if (typeof vehiculeId !== 'undefined') updateData.vehiculeId = vehiculeId;
    return await prisma.rapport.update({
      where: { id },
      data: updateData,
      include: {
        vehicule: true,
      },
    });
  },

  delete: async (id: number) => {
    // Vérifier si le rapport existe avant de le supprimer
    const rapport = await prisma.rapport.findUnique({ where: { id } });
    if (!rapport) {
      throw new Error(`Rapport avec l'ID ${id} n'existe pas`);
    }
    await prisma.rapport.delete({
      where: { id },
    });
    return true;
  },
};