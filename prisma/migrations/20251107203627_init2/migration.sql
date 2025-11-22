/*
  Warnings:

  - You are about to drop the `Chauffeur` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Affectation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountId` to the `Rapport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Rapport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Vehicule` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Chauffeur_telephone_key";

-- DropIndex
DROP INDEX "Chauffeur_email_key";

-- DropIndex
DROP INDEX "_Affectation_B_index";

-- DropIndex
DROP INDEX "_Affectation_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Chauffeur";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_Affectation";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rapport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kilometrage" INTEGER NOT NULL,
    "incidents" TEXT,
    "commentaires" TEXT,
    "chauffeurId" INTEGER NOT NULL,
    "vehiculeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    CONSTRAINT "Rapport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rapport_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rapport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rapport" ("chauffeurId", "commentaires", "date", "id", "incidents", "kilometrage", "vehiculeId") SELECT "chauffeurId", "commentaires", "date", "id", "incidents", "kilometrage", "vehiculeId" FROM "Rapport";
DROP TABLE "Rapport";
ALTER TABLE "new_Rapport" RENAME TO "Rapport";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT 'temp@example.com',
    "password" TEXT NOT NULL,
    "photo" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GESTIONNAIRE',
    "accountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "nom", "password", "photo", "role") SELECT "createdAt", "email", "id", "nom", "password", "photo", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Vehicule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "immatriculation" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vehicule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicule" ("annee", "createdAt", "id", "immatriculation", "marque", "modele", "statut", "userId") SELECT "annee", "createdAt", "id", "immatriculation", "marque", "modele", "statut", "userId" FROM "Vehicule";
DROP TABLE "Vehicule";
ALTER TABLE "new_Vehicule" RENAME TO "Vehicule";
CREATE UNIQUE INDEX "Vehicule_immatriculation_key" ON "Vehicule"("immatriculation");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
