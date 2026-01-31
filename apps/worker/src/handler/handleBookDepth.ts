import { timescalePool } from "../timescale";
import { BookDepthEvent } from "../types/index";

export async function handleBookDepth(event: BookDepthEvent) {
  const { bids, asks, outcome_id, timestamp } = event;
  const time = new Date(timestamp);
  if ((!bids || bids.length === 0) && (!asks || asks.length === 0)) {
    await timescalePool.query(
      `
      INSERT INTO order_book_depth
        (time, outcome_id, side, price, quantity, is_empty)
      VALUES ($1, $2, 'none', NULL, NULL, true)
      `,
      [time, outcome_id],
    );
    return;
  }
  const values: any[] = [];
  const placeholders: string[] = [];
  let i = 1;
  for (const [price, quantity] of bids) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(time, outcome_id, "bid", price, quantity, false);
  }
  for (const [price, quantity] of asks) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(time, outcome_id, "ask", price, quantity, false);
  }
  const sql = `
    INSERT INTO order_book_depth
      (time, outcome_id, side, price, quantity, is_empty)
    VALUES
      ${placeholders.join(",")}
  `;
  await timescalePool.query(sql, values);
}
