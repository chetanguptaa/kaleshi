use crate::engine::{engine::MatchingEngine, order::Order};
use parking_lot::RawMutex;
use parking_lot::lock_api::Mutex;
use redis::RedisResult;
use redis::Value as RedisValue;
use serde_json::Value as SerdeJsonValue;
use std::sync::Arc;
use tokio::time::{Duration, sleep};
use uuid::Uuid;

const STREAM_KEY: &str = "orders.commands.stream";
const GROUP: &str = "engine-group";

pub async fn start_order_stream_loop(
    redis_url: String,
    engine: Arc<Mutex<RawMutex, MatchingEngine>>,
) -> RedisResult<()> {
    let client = redis::Client::open(redis_url)?;
    let mut conn = client.get_async_connection().await?;
    let _: RedisResult<()> = redis::cmd("XGROUP")
        .arg("CREATE")
        .arg(STREAM_KEY)
        .arg(GROUP)
        .arg("0")
        .arg("MKSTREAM")
        .query_async(&mut conn)
        .await;
    let consumer_name = format!("engine-{}", Uuid::new_v4());
    println!("Matching Engine online as {}", consumer_name);
    loop {
        // XREADGROUP GROUP group consumer BLOCK 1000 STREAMS key >
        let reply: RedisResult<RedisValue> = redis::cmd("XREADGROUP")
            .arg("GROUP")
            .arg(GROUP)
            .arg(&consumer_name)
            .arg("BLOCK")
            .arg(1000)
            .arg("COUNT")
            .arg(50)
            .arg("STREAMS")
            .arg(STREAM_KEY)
            .arg(">")
            .query_async(&mut conn)
            .await;
        let msg = match reply {
            Ok(v) => v,
            Err(_) => {
                sleep(Duration::from_millis(50)).await;
                continue;
            }
        };
        if let RedisValue::Nil = msg {
            continue;
        }
        if let RedisValue::Bulk(streams) = msg {
            for stream in streams {
                if let RedisValue::Bulk(items) = stream {
                    if items.len() >= 2 {
                        if let RedisValue::Bulk(entries) = &items[1] {
                            for entry in entries {
                                if let RedisValue::Bulk(pair) = entry {
                                    if pair.len() >= 2 {
                                        // id
                                        let id = match &pair[0] {
                                            RedisValue::Data(bytes) => {
                                                String::from_utf8_lossy(bytes).into_owned()
                                            }
                                            _ => continue,
                                        };
                                        let mut map = serde_json::Map::new();
                                        if let RedisValue::Bulk(kvs) = &pair[1] {
                                            let mut iter = kvs.iter();
                                            while let (
                                                Some(RedisValue::Data(k)),
                                                Some(RedisValue::Data(v)),
                                            ) = (iter.next(), iter.next())
                                            {
                                                map.insert(
                                                    String::from_utf8_lossy(k).into_owned(),
                                                    serde_json::Value::String(
                                                        String::from_utf8_lossy(v).into_owned(),
                                                    ),
                                                );
                                            }
                                        }
                                        let payload = SerdeJsonValue::Object(map);
                                        handle_message(&engine, &payload).await;
                                        let _: RedisResult<()> = redis::cmd("XACK")
                                            .arg(STREAM_KEY)
                                            .arg(GROUP)
                                            .arg(id)
                                            .query_async(&mut conn)
                                            .await;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

async fn handle_message(engine: &Arc<Mutex<RawMutex, MatchingEngine>>, payload: &SerdeJsonValue) {
    let msg_type = payload.get("type").and_then(|v| v.as_str()).unwrap_or("");
    match msg_type {
        "order.new" => {
            if let Ok(order) = serde_json::from_value::<Order>(payload.clone()) {
                engine.lock().handle_new_order(order);
            } else {
                eprintln!("Invalid order.new payload: {:?}", payload);
            }
        }
        "order.cancelled" => {
            if let Some(order_id) = payload.get("order_id").and_then(|v| v.as_str()) {
                if let Some(account_id) = payload.get("account_id").and_then(|v| v.as_str()) {
                    engine.lock().handle_cancel(order_id, account_id);
                }
            }
        }
        _ => {
            eprintln!("Unknown event type: {}", msg_type);
        }
    }
}
