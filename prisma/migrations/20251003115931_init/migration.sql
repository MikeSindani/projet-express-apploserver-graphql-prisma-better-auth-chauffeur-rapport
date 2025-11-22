-- CreateTable
CREATE TABLE "Chauffeur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "permis" TEXT NOT NULL,
    "statut" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Chauffeur_telephone_key" ON "Chauffeur"("telephone");
