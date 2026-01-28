/*
  Warnings:

  - You are about to alter the column `buyerOrderId` on the `Fill` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `sellerOrderId` on the `Fill` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyerOrderId" INTEGER NOT NULL,
    "sellerOrderId" INTEGER NOT NULL,
    "buyerAccountId" INTEGER NOT NULL,
    "sellerAccountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fill_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_buyerAccountId_fkey" FOREIGN KEY ("buyerAccountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_sellerAccountId_fkey" FOREIGN KEY ("sellerAccountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fill" ("buyerAccountId", "buyerOrderId", "createdAt", "id", "price", "quantity", "sellerAccountId", "sellerOrderId") SELECT "buyerAccountId", "buyerOrderId", "createdAt", "id", "price", "quantity", "sellerAccountId", "sellerOrderId" FROM "Fill";
DROP TABLE "Fill";
ALTER TABLE "new_Fill" RENAME TO "Fill";
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "side" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "originalQuantity" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "orderType" TEXT NOT NULL DEFAULT 'LIMIT',
    "timeInForce" TEXT NOT NULL DEFAULT 'GTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("accountId", "createdAt", "id", "orderType", "originalQuantity", "outcomeId", "price", "quantity", "side", "status", "timeInForce", "updatedAt") SELECT "accountId", "createdAt", "id", "orderType", "originalQuantity", "outcomeId", "price", "quantity", "side", "status", "timeInForce", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_outcomeId_price_idx" ON "Order"("outcomeId", "price");
CREATE INDEX "Order_outcomeId_side_idx" ON "Order"("outcomeId", "side");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_accountId_idx" ON "Order"("accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
