/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `accountId` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `accountId` on the `CommentVote` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `buyerAccountId` on the `Fill` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `sellerAccountId` on the `Fill` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `accountId` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coins" INTEGER NOT NULL DEFAULT 300,
    "reservedCoins" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("coins", "createdAt", "id", "reservedCoins", "updatedAt", "userId") SELECT "coins", "createdAt", "id", "reservedCoins", "updatedAt", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comment" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    CONSTRAINT "Comment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("accountId", "comment", "createdAt", "deletedAt", "id", "isDeleted", "marketId", "parentId", "updatedAt") SELECT "accountId", "comment", "createdAt", "deletedAt", "id", "isDeleted", "marketId", "parentId", "updatedAt" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_marketId_idx" ON "Comment"("marketId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");
CREATE TABLE "new_CommentVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" INTEGER NOT NULL,
    "commentId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentVote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CommentVote" ("accountId", "commentId", "createdAt", "id", "vote") SELECT "accountId", "commentId", "createdAt", "id", "vote" FROM "CommentVote";
DROP TABLE "CommentVote";
ALTER TABLE "new_CommentVote" RENAME TO "CommentVote";
CREATE INDEX "CommentVote_commentId_idx" ON "CommentVote"("commentId");
CREATE UNIQUE INDEX "CommentVote_accountId_commentId_key" ON "CommentVote"("accountId", "commentId");
CREATE TABLE "new_Fill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
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
    "id" TEXT NOT NULL PRIMARY KEY,
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
