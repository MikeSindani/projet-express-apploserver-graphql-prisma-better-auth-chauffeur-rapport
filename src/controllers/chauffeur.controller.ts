import { prisma } from "@/lib/prisma";

type CoutArgs = {
  startDate?: string | Date;
  endDate?: string | Date;
};

export const ChauffeurController = {
  // Liste de tous les users de rôle CHAUFFEUR
  getAll: async () => {
    return await prisma.user.findMany({
      where: { role: "CHAUFFEUR" },
      include: {
        // ... ajuste selon ton schéma: relations éventuelles liées au user
        vehicules: true,
      },
    });
  },

  // Un seul chauffeur (user) par id — garantit role = CHAUFFEUR
  getOne: async (id: string) => {
    return await prisma.user.findFirst({
      where: { id, role: "CHAUFFEUR" },
      include: {
        vehicules: true,
      },
    });
  },

  // Mise à jour d'un chauffeur (user)
  update: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      telephone?: string;
      tarifKm?: number;
      tarifHeure?: number;
      // ne pas autoriser le changement de rôle ici sinon expliciter
    }
  ) => {
    // s'assure que la cible est bien un CHAUFFEUR
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CHAUFFEUR") {
      throw new Error("Utilisateur non trouvé ou n'est pas un chauffeur");
    }
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  // Suppression d'un chauffeur (user)
  delete: async (id: string) => {
    // s'assure que la cible est bien un CHAUFFEUR
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CHAUFFEUR") {
      throw new Error("Utilisateur non trouvé ou n'est pas un chauffeur");
    }
    return await prisma.user.delete({
      where: { id },
    });
  },

  // Calcul du coût total pour un chauffeur (user) sur une période.
  // Suppose l'existence d'un modèle "trajet" avec champs { chauffeurId, cout, date }.
  count: async () => { 
    return await prisma.user.count({ where: { role: "CHAUFFEUR" } });
  },
};
