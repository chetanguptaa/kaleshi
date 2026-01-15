use dotenvy::dotenv;
use redis::AsyncCommands;
use serde_json::Value;
use std::env;

pub async fn publish_event(event: &Value) {
    dotenv().ok();
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let client = redis::Client::open(redis_url).unwrap();
    let mut con = client.get_async_connection().await.unwrap();
    let _: () = con
        .publish("engine.events", event.to_string())
        .await
        .unwrap();
}
