use crate::error::EngineResult;
use redis::AsyncCommands;
use serde_json::Value;

pub async fn append_events_to_ledger(
    redis: &mut redis::aio::Connection,
    payload: Value,
) -> EngineResult<()> {
    let _: String = redis
        .xadd(
            "engine.ledger",
            "*",
            &[("payload", serde_json::to_string(&payload)?)],
        )
        .await?;
    Ok(())
}
