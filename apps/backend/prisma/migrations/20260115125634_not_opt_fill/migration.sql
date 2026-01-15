/*
  Warnings:

  - Made the column `buyerAccountId` on table `Fill` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sellerAccountId` on table `Fill` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "buyerAccountId" TEXT NOT NULL,
    "sellerAccountId" TEXT NOT NULL,
    "accountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Fill" ("accountId", "buyerAccountId", "buyerOrderId", "createdAt", "id", "price", "quantity", "sellerAccountId", "sellerOrderId") SELECT "accountId", "buyerAccountId", "buyerOrderId", "createdAt", "id", "price", "quantity", "sellerAccountId", "sellerOrderId" FROM "Fill";
DROP TABLE "Fill";
ALTER TABLE "new_Fill" RENAME TO "Fill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
