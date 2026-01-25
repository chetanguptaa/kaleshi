use crate::engine::{engine::MatchingEngine, events::EngineEvent};
use redis::{AsyncCommands, Value, streams::StreamReadReply};

const LEDGER_STREAM: &str = "engine.ledger";

pub async fn replay_ledger(
    redis: &mut redis::aio::Connection,
    engine: &mut MatchingEngine,
) -> anyhow::Result<()> {
    let mut last_id = "0-0".to_string();
    loop {
        let reply: StreamReadReply = redis.xread(&[LEDGER_STREAM], &[&last_id]).await?;
        if reply.keys.is_empty() {
            break;
        }
        for key in reply.keys {
            for id in key.ids {
                let payload_value = id
                    .map
                    .get("payload")
                    .ok_or_else(|| anyhow::anyhow!("ledger entry missing payload"))?;
                let payload = match payload_value {
                    Value::Data(bytes) => std::str::from_utf8(bytes)?,
                    _ => return Err(anyhow::anyhow!("payload is not bulk string")),
                };
                let event: EngineEvent = serde_json::from_str(payload)?;
                engine.apply(&event);
                last_id = id.id;
            }
        }
    }
    Ok(())
}
