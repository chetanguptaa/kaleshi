/*
  Warnings:

  - You are about to drop the column `accountId` on the `Fill` table. All the data in the column will be lost.

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fill_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_buyerAccountId_fkey" FOREIGN KEY ("buyerAccountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_sellerAccountId_fkey" FOREIGN KEY ("sellerAccountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fill" ("buyerAccountId", "buyerOrderId", "createdAt", "id", "price", "quantity", "sellerAccountId", "sellerOrderId") SELECT "buyerAccountId", "buyerOrderId", "createdAt", "id", "price", "quantity", "sellerAccountId", "sellerOrderId" FROM "Fill";
DROP TABLE "Fill";
ALTER TABLE "new_Fill" RENAME TO "Fill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
