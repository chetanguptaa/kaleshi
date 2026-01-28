use crate::{
    error::EngineResult,
    orderbook::{Price, Snapshot},
};
use redis::AsyncCommands;

pub async fn append_events_to_ledger(
    redis: &mut redis::aio::Connection,
    events: &Vec<(String, Option<Price>, Snapshot)>,
) -> EngineResult<()> {
    let _: String = redis
        .xadd(
            "engine.ledger",
            "*",
            &[("payload", serde_json::to_string(events)?)],
        )
        .await?;
    Ok(())
}
