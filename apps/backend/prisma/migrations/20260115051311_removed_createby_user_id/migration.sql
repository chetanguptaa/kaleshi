/*
  Warnings:

  - You are about to drop the column `createdByUserId` on the `MarketCategory` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MarketCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "information" JSONB,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MarketCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MarketCategory" ("createdAt", "id", "information", "name", "parentId", "updatedAt") SELECT "createdAt", "id", "information", "name", "parentId", "updatedAt" FROM "MarketCategory";
DROP TABLE "MarketCategory";
ALTER TABLE "new_MarketCategory" RENAME TO "MarketCategory";
CREATE UNIQUE INDEX "MarketCategory_name_key" ON "MarketCategory"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
