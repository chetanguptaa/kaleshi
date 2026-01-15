/*
  Warnings:

  - You are about to drop the column `price` on the `Outcome` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Outcome` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "marketId" INTEGER NOT NULL,
    "settledPrice" INTEGER,
    "isResolved" BOOLEAN,
    "winningOutcome" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outcome_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Outcome" ("createdAt", "id", "marketId", "name", "updatedAt") SELECT "createdAt", "id", "marketId", "name", "updatedAt" FROM "Outcome";
DROP TABLE "Outcome";
ALTER TABLE "new_Outcome" RENAME TO "Outcome";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
