/*
  Warnings:

  - You are about to drop the column `buyerAccountId` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `buyerOrderId` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `sellerAccountId` on the `Fill` table. All the data in the column will be lost.
  - You are about to drop the column `sellerOrderId` on the `Fill` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filledAccountId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filledOrderId` to the `Fill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Fill` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "filledOrderId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "filledAccountId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fill_filledOrderId_fkey" FOREIGN KEY ("filledOrderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_filledAccountId_fkey" FOREIGN KEY ("filledAccountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Fill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fill" ("createdAt", "id", "price", "quantity") SELECT "createdAt", "id", "price", "quantity" FROM "Fill";
DROP TABLE "Fill";
ALTER TABLE "new_Fill" RENAME TO "Fill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
