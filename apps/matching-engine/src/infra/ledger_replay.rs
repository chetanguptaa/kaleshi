use crate::{
    engine::{engine::MatchingEngine, stream::handle_message},
    error::{EngineError, EngineResult},
    infra::view_emitter::ViewEmitter,
};
use redis::{AsyncCommands, streams::StreamReadReply};
use serde_json::Value;

const LEDGER_STREAM: &str = "engine.ledger";

pub async fn replay_ledger(
    redis: &mut redis::aio::Connection,
    engine: &mut MatchingEngine,
    mut view_emitter: ViewEmitter,
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
                    redis::Value::Data(bytes) => std::str::from_utf8(bytes).map_err(|e| {
                        EngineError::StreamProcessing(format!("payload is not valid UTF-8: {}", e))
                    })?,
                    _ => {
                        return Err(EngineError::InvalidMessage(
                            "ledger payload is not a bulk string".to_string(),
                        ));
                    }
                };
                dbg!(&payload);
                let payload: Value = serde_json::from_str(payload)?;
                handle_message(redis, engine, &payload, &mut view_emitter).await?;
                // engine.apply_snapshots(snapshots).map_err(|e| {
                //     EngineError::Snapshot(format!("failed to apply snapshots from ledger: {}", e))
                // })?;
                last_id = id.id;
            }
        }
    }
    Ok(())
}
