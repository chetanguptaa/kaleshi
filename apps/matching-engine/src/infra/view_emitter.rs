use crate::engine::engine::MatchingEngine;
use redis::AsyncCommands;
use serde_json::json;

pub struct ViewEmitter {
    redis: redis::aio::Connection,
}

impl ViewEmitter {
    pub fn new(redis: redis::aio::Connection) -> Self {
        Self { redis }
    }

    pub async fn emit_book_depth(
        &mut self,
        engine: &MatchingEngine,
        outcome_id: &str,
    ) -> anyhow::Result<()> {
        let book = match engine.books.get(outcome_id) {
            Some(b) => b,
            None => return Ok(()),
        };
        let (bids, asks) = book.depth_levels(10);
        let event = json!({
            "type": "book.depth",
            "outcome_id": outcome_id,
            "bids": bids,
            "asks": asks,
            "timestamp": chrono::Utc::now().timestamp_millis()
        });
        let payload = serde_json::to_string(&event)?;
        let _: () = self.redis.publish("engine.events", payload).await?;
        Ok(())
    }

    pub async fn emit_market_data(
        &mut self,
        engine: &MatchingEngine,
        market_id: u32,
    ) -> anyhow::Result<()> {
        let outcomes = match engine.market_outcomes.get(&market_id) {
            Some(v) => v,
            None => return Ok(()),
        };
        let mut outcome_points = Vec::new();
        for outcome_id in outcomes {
            if let Some(book) = engine.books.get(outcome_id) {
                if book.last_trade_prices.is_empty() {
                    continue;
                }
                outcome_points.push(json!({
                    "outcome_id": outcome_id,
                    "ticker": book.ticker,
                    "total_volume": book.total_volume,
                    "total_notional": book.total_notional,
                    "prices": book.last_trade_prices,
                    "outcome_name": book.name,
                }));
            }
        }
        if outcome_points.is_empty() {
            return Ok(());
        }
        let event = json!({
            "type": "market.data",
            "market_id": market_id,
            "timestamp": chrono::Utc::now().timestamp_millis(),
            "outcomes": outcome_points,
            "market_probabilities": engine.market_probabilities(outcomes),
        });
        let payload = serde_json::to_string(&event)?;
        let _: () = self.redis.publish("engine.events", payload).await?;
        Ok(())
    }
}
