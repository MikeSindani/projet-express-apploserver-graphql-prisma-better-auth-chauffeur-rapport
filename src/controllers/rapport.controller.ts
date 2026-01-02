import log from '@/lib/log';
import { prisma } from '@/lib/prisma';

export const RapportController = {
  count : async (organizationId?: string) => {  
    log("/controllers/rapport.controller.ts");
    log("🔵 count rapport function");
    log("🔵 Starting to count rapports for organization:", { organizationId }); 
    if (organizationId) {
      return await prisma.rapport.count({
        where: { organizationId }
      });
    }
    log("🔵 No organizationId provided, returning 0");
    return 0
  },
  getAll: async () => {
    log("/controllers/rapport.controller.ts");
    log("🔵 getAll rapport function");
    log("🔵 Starting to get all rapports");
    return await prisma.rapport.findMany({
      include: {
        vehicule: true,
        user: true,
      },
    });
  },

  getOne: async (id: number) => {
    log("/controllers/rapport.controller.ts");
    log("🔵 getOne rapport function");
    log("🔵 Starting to get one rapport:", { id });
    return await prisma.rapport.findUnique({
      where: { id },
      include: {
        vehicule: true,
        user: true,
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
    log("/controllers/rapport.controller.ts");
    log("🔵 create rapport  function");
    log("🔵 Starting to create rapport:", { date, kilometrage, incidents, commentaires, chauffeurId, vehiculeId });
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


    log("🔵 OrganizationId for rapport creation:", { organizationId });
    return await prisma.rapport.create({
      data: {
        date: date || new Date(),
        kilometrage,
        incidents: incidents ?? null,
        commentaires: commentaires ?? null,
        userId: chauffeurId,
        organizationId,
        vehiculeId,
      },
      include: {
        vehicule: true,
        user: true,
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
    log("/controllers/rapport.controller.ts");
    log("🔵 update rapport function");
    log("🔵 Starting to update rapport:", { date, kilometrage, incidents, commentaires, chauffeurId, vehiculeId, id });
    // Vérifier si le rapport existe
    const existingRapport = await prisma.rapport.findUnique({ where: { id } });
    if (!existingRapport) {
      throw new Error(`Rapport avec l'ID ${id} n'existe pas`);
    }
    let chauffeur : any;
    // Vérifier les relations si elles sont mises à jour
    if (chauffeurId) {
      chauffeur = await prisma.user.findUnique({ where: { id: chauffeurId } });
      if (!chauffeur) {
        throw new Error(`Chauffeur avec l'ID ${chauffeurId} n'existe pas`);
      }
    }
    // Determine organizationId for the rapport (prefer chauffeur's organization if available)
    const organizationId = (chauffeur as any).organizationId ?? (existingRapport as any).organizationId;
    if (!organizationId) throw new Error('Unable to determine organizationId for rapport update');
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
        user: true,
      },
    });
  },

  delete: async (id: number) => {
    log("/controllers/rapport.controller.ts");
    log("🔵 delete rapport function");
    log("🔵 Starting to delete rapport:", { id });
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