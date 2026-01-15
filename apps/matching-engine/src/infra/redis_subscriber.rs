use crate::engine::engine::MatchingEngine;
use crate::engine::order::Order;
use futures::StreamExt;
use parking_lot::RawMutex;
use parking_lot::lock_api::Mutex;
use redis::Client;
use serde_json::Value;
use std::sync::Arc;
use tokio::task;

pub async fn start_redis_listener(
    engine: Arc<Mutex<RawMutex, MatchingEngine>>,
    redis_url: String,
) -> redis::RedisResult<()> {
    let client = Client::open(redis_url)?;
    let conn = client.get_async_connection().await?;
    let mut pubsub = conn.into_pubsub();
    pubsub.subscribe("orders.commands").await?;
    task::spawn(async move {
        let mut stream = pubsub.on_message();
        while let Some(msg) = stream.next().await {
            let payload: String = match msg.get_payload() {
                Ok(p) => p,
                Err(err) => {
                    eprintln!("Invalid payload: {:?}", err);
                    continue;
                }
            };
            let parsed: Value = match serde_json::from_str(&payload) {
                Ok(v) => v,
                Err(err) => {
                    eprintln!("JSON parse error: {:?}", err);
                    continue;
                }
            };
            if parsed.get("type") == Some(&Value::String("order.cancel".to_string())) {
                match serde_json::from_value::<Order>(parsed.clone()) {
                    Ok(order) => {
                        engine
                            .lock()
                            .handle_cancel(&order.order_id, &order.account_id);
                    }
                    Err(err) => eprintln!("Order decode error: {:?}", err),
                }
            }
            if parsed.get("type") == Some(&Value::String("order.new".to_string())) {
                match serde_json::from_value::<Order>(parsed.clone()) {
                    Ok(order) => {
                        engine.lock().handle_new_order(order);
                    }
                    Err(err) => eprintln!("Order decode error: {:?}", err),
                }
            }
        }
        eprintln!("Redis pubsub stream ended");
    });
    Ok(())
}
