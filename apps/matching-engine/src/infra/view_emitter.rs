use redis::AsyncCommands;
use rust_order_book::Depth;
use serde_json::json;

pub struct ViewEmitter {
    redis: redis::aio::Connection,
}

impl ViewEmitter {
    pub fn new(redis: redis::aio::Connection) -> Self {
        Self { redis }
    }

    pub async fn emit_book_depth(&mut self, outcome_id: &str, depth: Depth) -> anyhow::Result<()> {
        let asks = depth.asks;
        let bids = depth.bids;
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
}
