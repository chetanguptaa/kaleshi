use crate::engine::order::OrderWire;
use crate::engine::{engine::MatchingEngine, order::Order};
use crate::error::{EngineError, EngineResult};
use crate::infra::ledger::append_events_to_ledger;
use crate::infra::view_emitter::ViewEmitter;
use redis::Value as RedisValue;
use redis::aio::Connection;
use serde_json::Value as SerdeJsonValue;
use std::time::Duration;
use tracing::{debug, error, info, warn};

const STREAM_KEY: &str = "orders.commands.stream";
const GROUP: &str = "engine-group";
const BLOCK_TIMEOUT_MS: usize = 1000;
const BATCH_SIZE: usize = 50;
const AUTOCLAIM_IDLE_TIME_MS: usize = 30000; // 30 seconds

pub async fn start_order_stream_loop(
    redis_url: String,
    mut engine: MatchingEngine,
    mut view_emitter: ViewEmitter,
) -> EngineResult<()> {
    let client = redis::Client::open(redis_url)
        .map_err(|e| EngineError::Configuration(format!("Invalid Redis URL: {}", e)))?;
    let mut conn = client
        .get_async_connection()
        .await
        .map_err(|e| EngineError::Redis(e))?;
    // Create consumer group (ignore error if already exists)
    let _: Result<(), redis::RedisError> = redis::cmd("XGROUP")
        .arg("CREATE")
        .arg(STREAM_KEY)
        .arg(GROUP)
        .arg("0")
        .arg("MKSTREAM")
        .query_async(&mut conn)
        .await;
    let consumer_name = std::env::var("ENGINE_ID").unwrap_or_else(|_| {
        let default = "engine-1".to_string();
        warn!("ENGINE_ID not set, using default: {}", default);
        default
    });

    info!(
        "Starting order stream consumer: {} for group: {}",
        consumer_name, GROUP
    );

    // Reclaim pending messages on startup
    if let Err(e) =
        reclaim_pending_messages(&mut conn, &consumer_name, &mut engine, &mut view_emitter).await
    {
        error!("Failed to reclaim pending messages: {}", e);
        // Don't fail startup, just log the error
    }

    // Main processing loop
    loop {
        match process_stream_batch(&mut conn, &consumer_name, &mut engine, &mut view_emitter).await
        {
            Ok(_) => {
                // Successful batch processing
                debug!("Processed batch successfully");
            }
            Err(e) => {
                // Log error but continue processing
                error!(
                    "Error processing stream batch (severity: {}): {}",
                    e.severity(),
                    e
                );

                // For critical errors, we might want to back off
                if matches!(e.severity(), crate::error::ErrorSeverity::Critical) {
                    warn!("Critical error encountered, backing off for 5 seconds");
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
            }
        }
    }
}

/// Reclaim messages that were pending but not acknowledged
async fn reclaim_pending_messages(
    conn: &mut Connection,
    consumer_name: &str,
    engine: &mut MatchingEngine,
    view_emitter: &mut ViewEmitter,
) -> EngineResult<()> {
    info!("Attempting to reclaim pending messages");

    let reclaimed: RedisValue = redis::cmd("XAUTOCLAIM")
        .arg(STREAM_KEY)
        .arg(GROUP)
        .arg(consumer_name)
        .arg(AUTOCLAIM_IDLE_TIME_MS)
        .arg("0-0")
        .query_async(conn)
        .await
        .map_err(|e| {
            EngineError::StreamProcessing(format!("Failed to autoclaim messages: {}", e))
        })?;

    process_stream_reply(conn, engine, STREAM_KEY, GROUP, reclaimed, view_emitter).await?;

    info!("Pending message reclaim completed");
    Ok(())
}

/// Process a single batch of messages from the stream
async fn process_stream_batch(
    conn: &mut Connection,
    consumer_name: &str,
    engine: &mut MatchingEngine,
    view_emitter: &mut ViewEmitter,
) -> EngineResult<()> {
    let reply: RedisValue = redis::cmd("XREADGROUP")
        .arg("GROUP")
        .arg(GROUP)
        .arg(consumer_name)
        .arg("BLOCK")
        .arg(BLOCK_TIMEOUT_MS)
        .arg("COUNT")
        .arg(BATCH_SIZE)
        .arg("STREAMS")
        .arg(STREAM_KEY)
        .arg(">")
        .query_async(conn)
        .await
        .map_err(|e| EngineError::StreamProcessing(format!("Failed to read from stream: {}", e)))?;

    process_stream_reply(conn, engine, STREAM_KEY, GROUP, reply, view_emitter).await
}

/// Process the reply from XREADGROUP or XAUTOCLAIM
pub async fn process_stream_reply(
    conn: &mut Connection,
    engine: &mut MatchingEngine,
    stream_key: &str,
    group: &str,
    reply: RedisValue,
    view_emitter: &mut ViewEmitter,
) -> EngineResult<()> {
    let RedisValue::Bulk(streams) = reply else {
        // Empty response (timeout), not an error
        return Ok(());
    };

    for stream in streams {
        let RedisValue::Bulk(items) = stream else {
            warn!("Unexpected stream format, skipping");
            continue;
        };

        if items.len() < 2 {
            warn!("Stream items has insufficient data, skipping");
            continue;
        }

        let RedisValue::Bulk(entries) = &items[1] else {
            warn!("Entries is not a bulk type, skipping");
            continue;
        };

        for entry in entries {
            if let Err(e) =
                process_single_entry(conn, engine, stream_key, group, entry, view_emitter).await
            {
                // Log the error but continue processing other entries
                error!(
                    "Failed to process entry (severity: {}): {}",
                    e.severity(),
                    e
                );
            }
        }
    }

    Ok(())
}

/// Process a single stream entry
async fn process_single_entry(
    conn: &mut Connection,
    engine: &mut MatchingEngine,
    stream_key: &str,
    group: &str,
    entry: &RedisValue,
    view_emitter: &mut ViewEmitter,
) -> EngineResult<()> {
    let RedisValue::Bulk(pair) = entry else {
        return Err(EngineError::InvalidMessage(
            "Entry is not a bulk type".to_string(),
        ));
    };

    if pair.len() < 2 {
        return Err(EngineError::InvalidMessage(
            "Entry pair has insufficient data".to_string(),
        ));
    }

    let id = match &pair[0] {
        RedisValue::Data(bytes) => String::from_utf8_lossy(bytes).into_owned(),
        _ => {
            return Err(EngineError::InvalidMessage(
                "Entry ID is not data type".to_string(),
            ));
        }
    };
    debug!("Processing message with ID: {}", id);

    let mut map = serde_json::Map::new();
    if let RedisValue::Bulk(kvs) = &pair[1] {
        let mut iter = kvs.iter();
        while let (Some(RedisValue::Data(k)), Some(RedisValue::Data(v))) =
            (iter.next(), iter.next())
        {
            map.insert(
                String::from_utf8_lossy(k).into_owned(),
                SerdeJsonValue::String(String::from_utf8_lossy(v).into_owned()),
            );
        }
    }

    let payload = SerdeJsonValue::Object(map);

    match handle_message(conn, engine, &payload, view_emitter).await {
        Ok(_) => {
            // Successfully processed, acknowledge the message
            let _: Result<(), redis::RedisError> = redis::cmd("XACK")
                .arg(stream_key)
                .arg(group)
                .arg(&id)
                .query_async(conn)
                .await;

            debug!("Message {} processed and acknowledged", id);
            Ok(())
        }
        Err(e) => {
            // Check if error is retryable
            if e.is_retryable() {
                warn!(
                    "Message {} failed with retryable error, leaving pending: {}",
                    id, e
                );
                // Don't ACK - message will be retried
            } else {
                error!(
                    "Message {} failed with non-retryable error: {}. ACKing to prevent reprocessing",
                    id, e
                );
                // ACK to prevent infinite retries of bad messages
                let _: Result<(), redis::RedisError> = redis::cmd("XACK")
                    .arg(stream_key)
                    .arg(group)
                    .arg(&id)
                    .query_async(conn)
                    .await;
            }
            Err(e)
        }
    }
}

/// Handle an individual message based on its type
pub async fn handle_message(
    redis_conn: &mut Connection,
    engine: &mut MatchingEngine,
    payload: &SerdeJsonValue,
    view_emitter: &mut ViewEmitter,
) -> EngineResult<()> {
    let msg_type = payload
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| EngineError::MissingField("type".to_string()))?;
    match msg_type {
        "order.new" => handle_new_order(redis_conn, engine, payload, view_emitter).await,
        _ => Err(EngineError::UnknownEventType(msg_type.to_string())),
    }
}

/// Handle a new order message
async fn handle_new_order(
    redis_conn: &mut Connection,
    engine: &mut MatchingEngine,
    payload: &SerdeJsonValue,
    view_emitter: &mut ViewEmitter,
) -> EngineResult<()> {
    if !view_emitter.is_replay_mode {
        append_events_to_ledger(redis_conn, payload.clone())
            .await
            .map_err(|e| EngineError::Ledger(format!("Failed to append to ledger: {}", e)))?;
    }
    let wire =
        serde_json::from_value::<OrderWire>(payload.clone()).map_err(|e| EngineError::Json(e))?;
    let order = Order::try_from(wire)
        .map_err(|e| EngineError::OrderValidation(format!("Order validation failed: {}", e)))?;
    let (publish_events, orderbook, fair_prices_and_total_volumes) =
        engine.order_execution(redis_conn, &order).await;
    let book_depth = orderbook.depth(None);
    if !view_emitter.is_replay_mode {
        view_emitter
            .emit_book_depth(&order.outcome_id, book_depth)
            .await
            .map_err(|e| EngineError::ViewEmission(format!("Failed to emit book depth: {}", e)))?;
        view_emitter
            .emit_market_data(&order.market_id, &fair_prices_and_total_volumes)
            .await
            .map_err(|e| EngineError::ViewEmission(format!("Failed to emit market data: {}", e)))?;
        view_emitter
            .emit_events(publish_events)
            .await
            .map_err(|e| EngineError::ViewEmission(format!("Failed to emit events: {}", e)))?;
    }
    Ok(())
}
