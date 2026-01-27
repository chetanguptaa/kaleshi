use crate::error::EngineResult;
use redis::AsyncCommands;
use rust_order_book::Depth;
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
}
