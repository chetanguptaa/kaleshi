use crate::engine::events::EngineEvent;
use crate::engine::order::OrderWire;
use crate::engine::{engine::MatchingEngine, order::Order};
use crate::infra::ledger::append_events_to_ledger;
use crate::infra::view_emitter::ViewEmitter;
use redis::RedisResult;
use redis::Value as RedisValue;
use redis::aio::Connection;
use serde_json::Value as SerdeJsonValue;
use std::collections::HashSet;

const STREAM_KEY: &str = "orders.commands.stream";
const GROUP: &str = "engine-group";

pub async fn start_order_stream_loop(
    redis_url: String,
    mut engine: MatchingEngine,
    mut view_emitter: ViewEmitter,
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
    {
        let reclaimed: RedisValue = redis::cmd("XAUTOCLAIM")
            .arg(STREAM_KEY)
            .arg(GROUP)
            .arg(&consumer_name)
            .arg(0)
            .arg("0-0")
            .query_async(&mut conn)
            .await?;
        {}
        process_stream_reply(
            &mut conn,
            &mut engine,
            STREAM_KEY,
            GROUP,
            reclaimed,
            &mut view_emitter,
        )
        .await?;
    }
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
        process_stream_reply(
            &mut conn,
            &mut engine,
            STREAM_KEY,
            GROUP,
            reply,
            &mut view_emitter,
        )
        .await?;
    }
}

pub async fn process_stream_reply(
    conn: &mut redis::aio::Connection,
    engine: &mut MatchingEngine,
    stream_key: &str,
    group: &str,
    reply: RedisValue,
    view_emitter: &mut ViewEmitter,
) -> RedisResult<()> {
    let RedisValue::Bulk(streams) = reply else {
        return Ok(());
    };
    for stream in streams {
        let RedisValue::Bulk(items) = stream else {
            continue;
        };
        if items.len() < 2 {
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
            match handle_message(conn, engine, &payload, view_emitter).await {
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
    redis_conn: &mut Connection,
    engine: &mut MatchingEngine,
    payload: &SerdeJsonValue,
    view_emitter: &mut ViewEmitter,
) -> Result<(), anyhow::Error> {
    let msg_type = payload
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("missing type"))?;
    match msg_type {
        "order.new" => {
            let wire = serde_json::from_value::<OrderWire>(payload.clone())?;
            let order = Order::try_from(wire)?;
            let events = engine.decide_new_order(&order);
            {
                append_events_to_ledger(redis_conn, &events).await?;
            }
            dbg!(&events);
            {
                for event in &events {
                    engine.apply(event);
                }
            }
            let (touched_outcomes, touched_markets) = collect_touched(&engine, &events);
            for outcome_id in touched_outcomes {
                view_emitter.emit_book_depth(engine, &outcome_id).await?;
            }
            for market_id in touched_markets {
                view_emitter.emit_market_data(engine, market_id).await?;
            }
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
            let events = engine.decide_cancel(order_id, account_id)?;
            {
                append_events_to_ledger(redis_conn, &events).await?;
            }
            {
                for event in &events {
                    engine.apply(event);
                }
            }
            let (touched_outcomes, touched_markets) = collect_touched(&engine, &events);
            for outcome_id in touched_outcomes {
                view_emitter.emit_book_depth(engine, &outcome_id).await?;
            }
            for market_id in touched_markets {
                view_emitter.emit_market_data(engine, market_id).await?;
            }
            Ok(())
        }
        _ => Err(anyhow::anyhow!("unknown event type")),
    }
}

fn collect_touched(
    engine: &MatchingEngine,
    events: &[EngineEvent],
) -> (HashSet<String>, HashSet<u32>) {
    let mut outcomes = HashSet::new();
    let mut markets = HashSet::new();
    for event in events {
        match event {
            EngineEvent::OrderAdded { order } => {
                outcomes.insert(order.outcome_id.clone());
                markets.insert(order.market_id);
            }
            EngineEvent::OrderCancelled { order_id, .. } => {
                if let Some(outcome_id) = engine.find_outcome(order_id) {
                    outcomes.insert(outcome_id.clone());
                }
            }
            EngineEvent::OrderFilled { outcome_id, .. } => {
                outcomes.insert(outcome_id.clone());
            }
            _ => {}
        }
    }
    (outcomes, markets)
}
