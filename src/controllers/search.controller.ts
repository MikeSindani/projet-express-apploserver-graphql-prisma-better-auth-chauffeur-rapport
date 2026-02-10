import log from '@/lib/log';
import { prisma } from "@/lib/prisma";


export const SearchController = {
  /**
   * Search across chauffeurs, vehicules, and rapports
   * @param query - Search term
   * @param organizationId - Optional organization filter
   * @returns Object containing arrays of matching chauffeurs, vehicules, and rapports
   */
  searchAll: async (query: string, organizationId?: string, role?: string) => {
    if (!query || query.trim().length === 0) {
      return {
        chauffeurs: [],
        vehicules: [],
        rapports: [],
      };
    }

    const searchTerm = query.trim();

    // Build organization filter
    const orgFilter = organizationId ? { organizationId } : {};
    log(orgFilter);

    // Search Chauffeurs (Users with role CHAUFFEUR)
    let chauffeurs : any[] = [];
    if (role == 'GESTIONNAIRE') 
    chauffeurs = await prisma.user.findMany({
      where: {
        role: "CHAUFFEUR",
        ...orgFilter,
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { telephone: { contains: searchTerm } },
          { licenseNumber: { contains: searchTerm } },
        ],
      },
      include: {
        vehicules: true,
      },
      take: 20, // Limit results
    });

    // Search Vehicules
    const vehicules = await prisma.vehicule.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        OR: [
          { immatriculation: { contains: searchTerm } },
          { marque: { contains: searchTerm } },
          { modele: { contains: searchTerm } },
        ],
      },
      include: {
        user: true,
        rapports: true,
      },
      take: 20,
    });

    // Search Rapports

    const rapports = await prisma.rapport.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        OR: [
          { incidents: { contains: searchTerm } },
          { commentaires: { contains: searchTerm } },
        ],
      },
      include: {
        user: true,
        vehicule: true,
      },
      take: 20,
    });

    return {
      chauffeurs,
      vehicules,
      rapports,
    };
  },
};
