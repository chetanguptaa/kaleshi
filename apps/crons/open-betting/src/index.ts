import "dotenv/config";
import knex from "knex";

export const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

export async function start() {
  const BATCH_SIZE = 50;
  await db.transaction(async (trx) => {
    const markets = await trx.raw(
      `
        SELECT id
        FROM "Market"
        WHERE
          status = 'DRAFT'
          AND bettingStartAt <= NOW()
        ORDER BY bettingStartAt ASC
        LIMIT ?
        FOR UPDATE SKIP LOCKED
        `,
      [BATCH_SIZE],
    );
    const ids: number[] = markets.rows.map((r: any) => r.id);
    if (ids.length === 0) return;
    await trx.raw(
      `
        UPDATE "Market"
        SET
          status = 'OPEN',
          updatedAt = NOW()
        WHERE id = ANY(?)
        `,
      [ids],
    );
  });
}

start().catch((err) => {
  console.error("Open betting cron failed", err);
  process.exit(1);
});
