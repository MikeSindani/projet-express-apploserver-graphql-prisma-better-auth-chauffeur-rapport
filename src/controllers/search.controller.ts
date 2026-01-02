import log from '@/lib/log';
import { prisma } from "@/lib/prisma";


export const SearchController = {
  /**
   * Search across chauffeurs, vehicules, and rapports
   * @param query - Search term
   * @param organizationId - Optional organization filter
   * @returns Object containing arrays of matching chauffeurs, vehicules, and rapports
   */
  searchAll: async (query: string, organizationId?: number) => {
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
    log(orgFilter); // Added log statement for orgFilter

    // Search Chauffeurs (Users with role CHAUFFEUR)
    const chauffeurs = await prisma.user.findMany({
      where: {
        role: "CHAUFFEUR",
        ...orgFilter,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { telephone: { contains: searchTerm, mode: "insensitive" } },
          { licenseNumber: { contains: searchTerm, mode: "insensitive" } },
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
        ...(organizationId ? { user: { organizationId } } : {}),
        OR: [
          { immatriculation: { contains: searchTerm, mode: "insensitive" } },
          { marque: { contains: searchTerm, mode: "insensitive" } },
          { modele: { contains: searchTerm, mode: "insensitive" } },
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
        ...(organizationId ? { user: { organizationId } } : {}),
        OR: [
          { incidents: { contains: searchTerm, mode: "insensitive" } },
          { commentaires: { contains: searchTerm, mode: "insensitive" } },
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
