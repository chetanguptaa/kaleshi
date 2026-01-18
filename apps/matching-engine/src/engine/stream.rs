use crate::engine::order::OrderWire;
use crate::engine::{engine::MatchingEngine, order::Order};
use parking_lot::RawMutex;
use parking_lot::lock_api::Mutex;
use redis::RedisResult;
use redis::Value as RedisValue;
use serde_json::Value as SerdeJsonValue;
use std::sync::Arc;

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
    let consumer_name = std::env::var("ENGINE_ID").unwrap_or_else(|_| "engine-1".to_string());
    let reclaimed: RedisValue = redis::cmd("XAUTOCLAIM")
        .arg(STREAM_KEY)
        .arg(GROUP)
        .arg(&consumer_name)
        .arg(0)
        .arg("0-0")
        .query_async(&mut conn)
        .await?;
    process_stream_reply(&mut conn, &engine, STREAM_KEY, GROUP, reclaimed).await?;
    println!("Matching Engine online as {}", consumer_name);
    loop {
        let reply: RedisValue = redis::cmd("XREADGROUP")
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
            .await?;
        process_stream_reply(&mut conn, &engine, STREAM_KEY, GROUP, reply).await?;
    }
}

pub async fn process_stream_reply(
    conn: &mut redis::aio::Connection,
    engine: &Arc<Mutex<RawMutex, MatchingEngine>>,
    stream_key: &str,
    group: &str,
    reply: RedisValue,
) -> RedisResult<()> {
    let RedisValue::Bulk(streams) = reply else {
        return Ok(());
    };
    for stream in streams {
        let RedisValue::Bulk(items) = stream else {
            continue;
        };
        if items.len() < 2 {
            dbg!(items.len());
            continue;
        }
        let RedisValue::Bulk(entries) = &items[1] else {
            continue;
        };
        for entry in entries {
            let RedisValue::Bulk(pair) = entry else {
                continue;
            };
            if pair.len() < 2 {
                continue;
            }
            let id = match &pair[0] {
                RedisValue::Data(bytes) => String::from_utf8_lossy(bytes).into_owned(),
                _ => continue,
            };
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
            match handle_message(engine, &payload).await {
                Ok(_) => {
                    let _: RedisResult<()> = redis::cmd("XACK")
                        .arg(stream_key)
                        .arg(group)
                        .arg(&id)
                        .query_async(conn)
                        .await;
                }
                Err(err) => {
                    eprintln!("Message {} failed processing; leaving pending: {}", id, err);
                    // NO ACK
                }
            }
        }
    }
    Ok(())
}

async fn handle_message(
    engine: &Arc<Mutex<RawMutex, MatchingEngine>>,
    payload: &SerdeJsonValue,
) -> Result<(), anyhow::Error> {
    let msg_type = payload
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("missing type"))?;

    match msg_type {
        "order.new" => {
            let wire = serde_json::from_value::<OrderWire>(payload.clone())?;
            let order = Order::try_from(wire)?;
            engine.lock().handle_new_order(order);
            Ok(())
        }
        "order.cancelled" => {
            let order_id = payload
                .get("order_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing order_id"))?;
            let account_id = payload
                .get("account_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing account_id"))?;
            engine.lock().handle_cancel(order_id, account_id);
            Ok(())
        }
        _ => Err(anyhow::anyhow!("unknown event type")),
    }
}
