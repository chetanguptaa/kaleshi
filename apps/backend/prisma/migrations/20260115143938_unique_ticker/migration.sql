/*
  Warnings:

  - A unique constraint covering the columns `[ticker]` on the table `Outcome` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Outcome_ticker_key" ON "Outcome"("ticker");
