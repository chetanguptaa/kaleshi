import "dotenv/config";
import knex from "knex";
import { cancelOpenOrdersAndRefund } from "./cancel-open-orders-and-redund";
import { calculatePositionsFromFills } from "./calculate-positions";

export const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

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
      const winningOutcome = await db("Outcome")
        .where({ marketId, winningOutcome: true, isResolved: true })
        .first();
      if (!winningOutcome) {
        console.log(`Market ${marketId} has no winning outcome yet`);
        continue;
      }
      await cancelOpenOrdersAndRefund(marketId);
      const positions = await calculatePositionsFromFills(marketId);
      for (const [accountId, shares] of positions) {
        const payout = shares * 100;
        await db("accounts")
          .where({ id: accountId })
          .increment("coins", payout);
        console.log(
          `✅ Paid account ${accountId}: ${shares} shares = ${payout} cents`,
        );
      }
      await db("markets").where({ id: marketId }).update({ status: "SETTLED" });
      console.log(`✅ Market ${marketId} settled successfully`);
    }
  });
}

start().catch((err) => {
  console.error("settle market cron failed", err);
  process.exit(1);
});
