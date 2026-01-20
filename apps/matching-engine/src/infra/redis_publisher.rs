use dotenvy::dotenv;
use redis::AsyncCommands;
use serde_json::Value;
use std::env;

pub async fn publish_event(event: &Value) {
    dotenv().ok();
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let client = redis::Client::open(redis_url).expect("Invalid Redis URL");
    let mut con = client
        .get_async_connection()
        .await
        .expect("Failed to connect to Redis");
    let _: String = con
        .xadd("engine.events", "*", &[("payload", event.to_string())])
        .await
        .expect("Failed to add event to stream");
}
