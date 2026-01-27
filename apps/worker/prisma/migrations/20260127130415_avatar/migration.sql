/*
  Warnings:

  - You are about to drop the column `information` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `information` on the `MarketCategory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Outcome" ADD COLUMN "avatar" TEXT;
ALTER TABLE "Outcome" ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Market" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "metadata" JSONB,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "marketCategoryId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "ruleBook" TEXT,
    "rules" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Market_marketCategoryId_fkey" FOREIGN KEY ("marketCategoryId") REFERENCES "MarketCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("createdAt", "endsAt", "id", "isActive", "marketCategoryId", "name", "ruleBook", "rules", "startsAt", "updatedAt") SELECT "createdAt", "endsAt", "id", "isActive", "marketCategoryId", "name", "ruleBook", "rules", "startsAt", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE UNIQUE INDEX "Market_name_startsAt_endsAt_key" ON "Market"("name", "startsAt", "endsAt");
CREATE TABLE "new_MarketCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "metadata" JSONB,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MarketCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MarketCategory" ("createdAt", "id", "name", "parentId", "updatedAt") SELECT "createdAt", "id", "name", "parentId", "updatedAt" FROM "MarketCategory";
DROP TABLE "MarketCategory";
ALTER TABLE "new_MarketCategory" RENAME TO "MarketCategory";
CREATE UNIQUE INDEX "MarketCategory_name_key" ON "MarketCategory"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
