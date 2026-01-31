/*
  Warnings:

  - You are about to drop the column `endsAt` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `Market` table. All the data in the column will be lost.
  - Added the required column `bettingEndAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bettingStartAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventEndAt` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventStartAt` to the `Market` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Market" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "metadata" JSONB,
    "bettingStartAt" DATETIME NOT NULL,
    "bettingEndAt" DATETIME NOT NULL,
    "eventStartAt" DATETIME NOT NULL,
    "eventEndAt" DATETIME NOT NULL,
    "marketCategoryId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DEACTIVATED',
    "ruleBook" TEXT,
    "rules" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Market_marketCategoryId_fkey" FOREIGN KEY ("marketCategoryId") REFERENCES "MarketCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("avatar", "createdAt", "id", "marketCategoryId", "metadata", "name", "ruleBook", "rules", "updatedAt") SELECT "avatar", "createdAt", "id", "marketCategoryId", "metadata", "name", "ruleBook", "rules", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE INDEX "Market_status_bettingEndAt_idx" ON "Market"("status", "bettingEndAt");
CREATE INDEX "Market_status_eventEndAt_idx" ON "Market"("status", "eventEndAt");
CREATE UNIQUE INDEX "Market_name_eventStartAt_key" ON "Market"("name", "eventStartAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
