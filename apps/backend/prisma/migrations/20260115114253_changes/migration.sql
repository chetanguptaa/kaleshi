/*
  Warnings:

  - You are about to drop the column `buyOrderId` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `contractId` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `sellOrderId` on the `Fill` table. All the data in the column will be lost.
  - Added the required column `buyerOrderId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerOrderId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalQuantity` to the `Order` table without a default value. This is not possible if the table is not empty.

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
    "buyerAccountId" TEXT,
    "sellerAccountId" TEXT,
    "accountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Fill" ("accountId", "createdAt", "id", "price", "quantity") SELECT "accountId", "createdAt", "id", "price", "quantity" FROM "Fill";
DROP TABLE "Fill";
ALTER TABLE "new_Fill" RENAME TO "Fill";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "side" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "originalQuantity" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "orderType" TEXT NOT NULL DEFAULT 'LIMIT',
    "timeInForce" TEXT NOT NULL DEFAULT 'GTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("accountId", "createdAt", "id", "marketId", "outcomeId", "price", "quantity", "side", "updatedAt") SELECT "accountId", "createdAt", "id", "marketId", "outcomeId", "price", "quantity", "side", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_outcomeId_price_idx" ON "Order"("outcomeId", "price");
CREATE INDEX "Order_outcomeId_side_idx" ON "Order"("outcomeId", "side");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_accountId_idx" ON "Order"("accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
