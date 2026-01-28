use crate::{
    engine::engine::MatchingEngine,
    error::{EngineError, EngineResult},
    orderbook::Snapshot,
};
use redis::{AsyncCommands, Value, streams::StreamReadReply};

const LEDGER_STREAM: &str = "engine.ledger";

pub async fn replay_ledger(
    redis: &mut redis::aio::Connection,
    engine: &mut MatchingEngine,
) -> EngineResult<()> {
    let mut last_id = "0-0".to_string();
    loop {
        let reply: StreamReadReply = redis.xread(&[LEDGER_STREAM], &[&last_id]).await?;
        if reply.keys.is_empty() {
            break;
        }
        for key in reply.keys {
            for id in key.ids {
                let payload_value = id.map.get("payload").ok_or_else(|| {
                    EngineError::MissingField("ledger entry missing payload".to_string())
                })?;
                let payload = match payload_value {
                    Value::Data(bytes) => std::str::from_utf8(bytes).map_err(|e| {
                        EngineError::StreamProcessing(format!("payload is not valid UTF-8: {}", e))
                    })?,
                    _ => {
                        return Err(EngineError::InvalidMessage(
                            "ledger payload is not a bulk string".to_string(),
                        ));
                    }
                };
                dbg!(&payload);
                let snapshots: Vec<(String, Snapshot)> = serde_json::from_str(payload)?;
                engine.apply_snapshots(snapshots).map_err(|e| {
                    EngineError::Snapshot(format!("failed to apply snapshots from ledger: {}", e))
                })?;
                last_id = id.id;
            }
        }
    }
    Ok(())
}
