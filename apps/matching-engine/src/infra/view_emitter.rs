use crate::{
    engine::publish_events::PublishEngineEvent,
    error::EngineResult,
    orderbook::{Depth, Price, Snapshot},
};
use redis::AsyncCommands;
use serde_json::json;

pub struct ViewEmitter {
    redis: redis::aio::Connection,
    stream: &'static str,
}

impl ViewEmitter {
    pub fn new(redis: redis::aio::Connection) -> Self {
        Self {
            redis,
            stream: "engine.events",
        }
    }
    pub async fn emit_book_depth(&mut self, outcome_id: &str, depth: Depth) -> EngineResult<()> {
        let event = json!({
            "type": "book.depth",
            "outcome_id": outcome_id,
            "bids": depth.bids,
            "asks": depth.asks,
            "timestamp": chrono::Utc::now().timestamp_millis(),
        });
        let payload = serde_json::to_string(&event)?;
        let _: String = self
            .redis
            .xadd(self.stream, "*", &[("payload", payload)])
            .await?;
        Ok(())
    }
    pub async fn emit_market_data(
        &mut self,
        market_id: &u32,
        snapshots: &Vec<(String, Option<Price>, Price, Snapshot)>,
    ) -> EngineResult<()> {
        let current_fair_price_and_total_volume: Vec<serde_json::Value> = snapshots
            .iter()
            .map(|(outcome_id, fair_price, total_volume, _)| {
                json!({
                    "outcomeId": outcome_id,
                    "fairPrice": fair_price,
                    "totalVolume": total_volume,
                })
            })
            .collect();
        let event = json!({
            "type": "market.data",
            "marketId": market_id,
            "data": current_fair_price_and_total_volume,
            "timestamp": chrono::Utc::now().timestamp_millis(),
        });
        let payload = serde_json::to_string(&event)?;
        let _: String = self
            .redis
            .xadd(self.stream, "*", &[("payload", payload)])
            .await?;
        Ok(())
    }
    pub async fn emit_events(&mut self, events: Vec<PublishEngineEvent>) -> EngineResult<()> {
        for event in events {
            let payload: String = serde_json::to_string(&event)?;
            let _: String = self
                .redis
                .xadd(self.stream, "*", &[("payload", payload)])
                .await?;
        }
        Ok(())
    }
}
