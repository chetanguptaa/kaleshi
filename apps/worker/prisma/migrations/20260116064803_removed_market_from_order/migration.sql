/*
  Warnings:

  - You are about to drop the column `marketId` on the `Order` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "side" TEXT NOT NULL,
    "price" INTEGER,
    "quantity" INTEGER NOT NULL,
    "originalQuantity" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
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
