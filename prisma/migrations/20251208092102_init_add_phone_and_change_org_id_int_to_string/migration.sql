/*
  Warnings:

  - You are about to drop the column `chauffeurId` on the `Rapport` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rapport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kilometrage" INTEGER NOT NULL,
    "incidents" TEXT,
    "commentaires" TEXT,
    "vehiculeId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "Rapport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rapport_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rapport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rapport" ("commentaires", "date", "id", "incidents", "kilometrage", "organizationId", "userId", "vehiculeId") SELECT "commentaires", "date", "id", "incidents", "kilometrage", "organizationId", "userId", "vehiculeId" FROM "Rapport";
DROP TABLE "Rapport";
ALTER TABLE "new_Rapport" RENAME TO "Rapport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
