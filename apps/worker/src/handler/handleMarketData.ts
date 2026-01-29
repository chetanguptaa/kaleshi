import { timescalePool } from "../timescale";
import { MarketDataEvent } from "../types";

export async function handleMarketData(event: MarketDataEvent) {
  const { marketId, data, timestamp } = event;
  if (!marketId || !data || data.length === 0) {
    return;
  }
  const time = new Date(timestamp);
  const values: any[] = [];
  const placeholders: string[] = [];
  let i = 1;
  for (const { outcomeId, fairPrice, totalVolume } of data) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(time, marketId, outcomeId, fairPrice || 0, totalVolume || 0);
  }
  const sql = `
    INSERT INTO market_data
      (time, market_id, outcome_id, fair_price, total_volume)
    VALUES
      ${placeholders.join(",")}
  `;
  await timescalePool.query(sql, values);
}
