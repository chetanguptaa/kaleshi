import { timescalePool } from "../timescale";
import { BookDepthEvent } from "../types/index";

export async function handleBookDepth(event: BookDepthEvent) {
  const { bids, asks, outcome_id, timestamp } = event;
  if ((!bids || bids.length === 0) && (!asks || asks.length === 0)) {
    return;
  }
  const time = new Date(timestamp);
  const values: any[] = [];
  const placeholders: string[] = [];
  let i = 1;
  for (const [price, quantity] of bids) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(time, outcome_id, "bid", price, quantity);
  }
  for (const [price, quantity] of asks) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(time, outcome_id, "ask", price, quantity);
  }
  const sql = `
    INSERT INTO order_book_depth
      (time, outcome_id, side, price, quantity)
    VALUES
      ${placeholders.join(",")}
  `;
  await timescalePool.query(sql, values);
}
