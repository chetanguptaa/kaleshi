/*
  Warnings:

  - You are about to drop the column `ticker` on the `Market` table. All the data in the column will be lost.
  - Added the required column `ticker` to the `Outcome` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Market" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "marketCategoryId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "information" JSONB,
    "ruleBook" TEXT,
    "rules" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Market_marketCategoryId_fkey" FOREIGN KEY ("marketCategoryId") REFERENCES "MarketCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("createdAt", "endsAt", "id", "information", "isActive", "marketCategoryId", "name", "ruleBook", "rules", "startsAt", "updatedAt") SELECT "createdAt", "endsAt", "id", "information", "isActive", "marketCategoryId", "name", "ruleBook", "rules", "startsAt", "updatedAt" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE UNIQUE INDEX "Market_name_startsAt_endsAt_key" ON "Market"("name", "startsAt", "endsAt");
CREATE TABLE "new_Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "marketId" INTEGER NOT NULL,
    "ticker" TEXT NOT NULL,
    "settledPrice" INTEGER,
    "isResolved" BOOLEAN,
    "winningOutcome" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outcome_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Outcome" ("createdAt", "id", "isResolved", "marketId", "name", "settledPrice", "updatedAt", "winningOutcome") SELECT "createdAt", "id", "isResolved", "marketId", "name", "settledPrice", "updatedAt", "winningOutcome" FROM "Outcome";
DROP TABLE "Outcome";
ALTER TABLE "new_Outcome" RENAME TO "Outcome";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
