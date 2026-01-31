import "dotenv/config";
import knex from "knex";

export const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

export const calculatePotentialWin = (price?: number) => {
  if (!price || price <= 0) return 0;
  const probability = price / 100;
  const bet = 100; // $100
  return Math.round(bet / probability);
};

export async function start() {
  const BATCH_SIZE = 50;
  await db.transaction(async (trx) => {
    const marketsRes = await trx.raw(
      `
      SELECT id
      FROM "Market"
      WHERE status = 'CLOSED'
      LIMIT ?
      FOR UPDATE SKIP LOCKED
      `,
      [BATCH_SIZE],
    );
    const marketIds: number[] = marketsRes.rows.map((r: any) => r.id);
    if (marketIds.length === 0) return;
    for (const marketId of marketIds) {
      const fills = await trx.raw(
        `
        SELECT
            f.id,
            f.price,
            f.quantity,
            f.filledAccountId,
            o.winningOutcome,
            o.isResolved
          FROM "Fill" f
          JOIN "Order" ord ON ord.id = f."filledOrderId"
          JOIN "Outcome" o ON o.id = ord."outcomeId"
          WHERE o."marketId" = ?
        `,
        [marketId],
      );
      if (fills.rows.length === 0) {
        continue;
      }
      const rows = fills.rows;
      const outcomes = new Map<string, any[]>();
      let hasWinningOutcome = false;
      for (const row of rows) {
        if (!outcomes.has(row.outcomeId)) {
          outcomes.set(row.outcomeId, []);
        }
        outcomes.get(row.outcomeId)!.push(row);
        if (row.winningOutcome === true) {
          hasWinningOutcome = true;
        }
      }
      if (!hasWinningOutcome) {
        continue;
      }
      for (const fill of fills) {
        if (!fill.id) continue;
        if (fill.winningOutcome === true) {
          const payout = calculatePotentialWin(fill.price) * fill.quantity;
          await trx.raw(
            `
                  UPDATE "Account"
                  SET balance = balance + ?
                  WHERE id = ?
                  `,
            [payout, fill.filledAccountId],
          );
        }
        // LOSERS: nothing (stake already spent)
      }
      await trx.raw(
        `
        UPDATE "Market"
        SET status = 'SETTLED',
            updatedAt = NOW()
        WHERE id = ?
        `,
        [marketId],
      );
    }
  });
}

start().catch((err) => {
  console.error("Worker failed", err);
  process.exit(1);
});
