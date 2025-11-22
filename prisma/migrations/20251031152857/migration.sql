-- AlterTable
ALTER TABLE "Chauffeur" ADD COLUMN "photo" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT 'temp@example.com',
    "password" TEXT NOT NULL,
    "photo" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GESTIONNAIRE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "nom", "password", "role") SELECT "createdAt", "email", "id", "nom", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
