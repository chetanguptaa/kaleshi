use crate::{
    error::EngineResult,
    orderbook::{Price, Snapshot},
};
use redis::AsyncCommands;

pub async fn append_events_to_ledger(
    redis: &mut redis::aio::Connection,
    events: &Vec<(String, Option<Price>, u64, Snapshot)>,
) -> EngineResult<()> {
    let snapshot: Vec<(String, Snapshot)> = events
        .iter()
        .map(|(outcome_id, _, _, snapshot)| (outcome_id.clone(), snapshot.clone()))
        .collect();
    let _: String = redis
        .xadd(
            "engine.ledger",
            "*",
            &[("payload", serde_json::to_string(&snapshot)?)],
        )
        .await?;
    Ok(())
}
