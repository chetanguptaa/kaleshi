import { Injectable } from '@nestjs/common';
import { TimeseriesService } from 'src/timeseries/timeseries.service';

@Injectable()
export class OutcomeService {
  constructor(private readonly timeseriesService: TimeseriesService) {}

  async getBookDepth(outcomeId: string) {
    const latestBookDepthSql = `
        SELECT is_empty
        FROM order_book_depth
        WHERE outcome_id = $1
        ORDER BY time DESC
        LIMIT 1
      `;
    const latest = await this.timeseriesService.query(latestBookDepthSql, [
      outcomeId,
    ]);
    if (latest.rows.length === 0 || latest.rows[0].is_empty) {
      return { success: true, bids: [], asks: [] };
    }
    const sql = `
      SELECT
        side,
        price,
        last(quantity, time) AS quantity
      FROM order_book_depth
      WHERE outcome_id = $1
      GROUP BY side, price
      HAVING last(quantity, time) > 0
      ORDER BY
        side,
        CASE WHEN side = 'bid' THEN price END DESC,
        CASE WHEN side = 'ask' THEN price END ASC
    `;

    const { rows } = await this.timeseriesService.query(sql, [outcomeId]);
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];
    for (const row of rows) {
      const price = Number(row.price);
      const quantity = Number(row.quantity);
      if (row.side === 'bid') {
        bids.push([price, quantity]);
      } else {
        asks.push([price, quantity]);
      }
    }
    return { success: true, bids, asks };
  }
}
