/*
  Warnings:

  - Added the required column `email` to the `Chauffeur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `motDePasse` to the `Chauffeur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Chauffeur` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GESTIONNAIRE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vehicule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "immatriculation" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rapport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kilometrage" INTEGER NOT NULL,
    "incidents" TEXT,
    "commentaires" TEXT,
    "chauffeurId" INTEGER NOT NULL,
    "vehiculeId" INTEGER NOT NULL,
    CONSTRAINT "Rapport_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "Chauffeur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rapport_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_Affectation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_Affectation_A_fkey" FOREIGN KEY ("A") REFERENCES "Chauffeur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Affectation_B_fkey" FOREIGN KEY ("B") REFERENCES "Vehicule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chauffeur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "permis" TEXT NOT NULL,
    "statut" BOOLEAN NOT NULL DEFAULT true,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chauffeur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chauffeur" ("createdAt", "id", "nom", "permis", "statut", "telephone") SELECT "createdAt", "id", "nom", "permis", "statut", "telephone" FROM "Chauffeur";
DROP TABLE "Chauffeur";
ALTER TABLE "new_Chauffeur" RENAME TO "Chauffeur";
CREATE UNIQUE INDEX "Chauffeur_email_key" ON "Chauffeur"("email");
CREATE UNIQUE INDEX "Chauffeur_telephone_key" ON "Chauffeur"("telephone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicule_immatriculation_key" ON "Vehicule"("immatriculation");

-- CreateIndex
CREATE UNIQUE INDEX "_Affectation_AB_unique" ON "_Affectation"("A", "B");

-- CreateIndex
CREATE INDEX "_Affectation_B_index" ON "_Affectation"("B");
