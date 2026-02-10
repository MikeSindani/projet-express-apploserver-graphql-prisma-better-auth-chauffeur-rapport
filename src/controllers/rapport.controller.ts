import { exportRapportsExcel } from '@/lib/excel';
import log from '@/lib/log';
import { prisma } from '@/lib/prisma';

export const RapportController = {
  getAll: async (organizationId: string, chauffeurId?: string) => {
    log('/controllers/rapport.controller.ts');
    log("🔵 getAll function", { organizationId, chauffeurId });
    return await prisma.rapport.findMany({
      where: {
        organizationId,
        ...(chauffeurId ? { userId: chauffeurId } : {}),
      },
      include: {
        user: true,
        vehicule: true,
        images: true,
      },
      orderBy: { date: 'desc' },
    });
  },

  getOne: async (id: number, organizationId: string) => {
    log('/controllers/rapport.controller.ts');
    log("🔵 getOne function", { id, organizationId });
    return await prisma.rapport.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        user: true,
        vehicule: true,
        images: true,
      },
    });
  },

  count: async (organizationId: string) => {
    log('/controllers/rapport.controller.ts');
    log("🔵 count function", { organizationId });
    return await prisma.rapport.count({
      where: { organizationId },
    });
  },

  create: async (args: any) => {
    log('/controllers/rapport.controller.ts');
    log("🔵 create function", args);
    
    // In schema, userId is the chauffeurId
    const { chauffeurId, vehiculeId, date, ...rest } = args;
    
    // Find organizationId from vehicle if not provided
    const vehicule = await prisma.vehicule.findUnique({
      where: { id: vehiculeId },
      select: { organizationId: true }
    });

    if (!vehicule) throw new Error("Véhicule non trouvé");

    return await prisma.rapport.create({
      data: {
        ...rest,
        date: date ? new Date(date) : new Date(),
        userId: chauffeurId,
        vehiculeId: vehiculeId,
        organizationId: vehicule.organizationId,
      },
      include: {
        user: true,
        vehicule: true,
      }
    });
  },

  update: async (data: any, id: number) => {
    log('/controllers/rapport.controller.ts');
    log("🔵 update function", { id, data });
    
    const { chauffeurId, vehiculeId, date, id: _, ...rest } = data;
    
    return await prisma.rapport.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
        ...(chauffeurId ? { userId: chauffeurId } : {}),
        ...(vehiculeId ? { vehiculeId } : {}),
      },
      include: {
        user: true,
        vehicule: true,
      }
    });
  },

  delete: async (id: number) => {
    log('/controllers/rapport.controller.ts');
    log("🔵 delete function", { id });
    return await prisma.rapport.delete({
      where: { id },
    });
  },
  exportExcel: exportRapportsExcel,
};