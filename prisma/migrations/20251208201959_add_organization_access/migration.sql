-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GESTIONNAIRE',
    "telephone" TEXT,
    "licenseNumber" TEXT,
    "organizationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationAccess" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "licenseNumber", "name", "organizationId", "password", "role", "telephone", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "licenseNumber", "name", "organizationId", "password", "role", "telephone", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_telephone_key" ON "User"("telephone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
