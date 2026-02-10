import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export const exportRapportsExcel = async (organizationId: string) => {
  const rapports = await prisma.rapport.findMany({
    where: { organizationId },
    include: {
      user: true,
      vehicule: true,
    },
    orderBy: { date: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rapports');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Date du Rapport', key: 'date', width: 25 },
    { header: 'Kilométrage (km)', key: 'kilometrage', width: 20 },
    { header: 'Chauffeur', key: 'chauffeur', width: 30 },
    { header: 'Véhicule', key: 'vehicule', width: 35 },
    { header: 'Incidents', key: 'incidents', width: 50 },
    { header: 'Commentaires', key: 'commentaires', width: 50 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }, // Blue 600
  };

  // Add rows
  rapports.forEach((r: any) => {
    worksheet.addRow({
      id: r.id,
      date: new Date(r.date).toLocaleString('fr-FR'),
      kilometrage: r.kilometrage,
      chauffeur: r.user?.name || 'Inconnu',
      vehicule: r.vehicule ? `${r.vehicule.marque} ${r.vehicule.modele} (${r.vehicule.immatriculation})` : 'Inconnu',
      incidents: r.incidents || 'Aucun',
      commentaires: r.commentaires || 'Aucun',
    });
  });

  return await workbook.xlsx.writeBuffer();
};