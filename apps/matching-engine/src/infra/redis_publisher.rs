use redis::AsyncCommands;
use serde_json::Value;

pub async fn publish_event(event: &Value) {
    let client = redis::Client::open("redis://127.0.0.1/").unwrap();
    let mut con = client.get_async_connection().await.unwrap();
    let _: () = con
        .publish("engine.events", event.to_string())
        .await
        .unwrap();
}
