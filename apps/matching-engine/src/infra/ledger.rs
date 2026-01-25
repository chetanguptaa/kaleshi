use redis::AsyncCommands;

use crate::engine::events::EngineEvent;

pub async fn append_events_to_ledger(
    redis: &mut redis::aio::Connection,
    events: &[EngineEvent],
) -> anyhow::Result<()> {
    for event in events {
        let payload = serde_json::to_string(event)?;
        let _: String = redis
            .xadd("engine.ledger", "*", &[("payload", payload)])
            .await?;
    }
    Ok(())
}
