use redis::AsyncCommands;
use rust_order_book::Snapshot;

pub async fn append_events_to_ledger(
    redis: &mut redis::aio::Connection,
    events: &Vec<(String, Snapshot)>,
) -> anyhow::Result<()> {
    let _: String = redis
        .xadd(
            "engine.ledger",
            "*",
            &[("payload", serde_json::to_string(events)?)],
        )
        .await?;
    Ok(())
}
