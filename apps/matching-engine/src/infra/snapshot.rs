use crate::engine::engine::MatchingEngine;
use chrono::Utc;
use parking_lot::RawMutex;
use parking_lot::lock_api::Mutex;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs as async_fs;

#[derive(Serialize)]
struct Snapshot {
    timestamp: i64,
    orderbooks: serde_json::Value,
}

pub async fn write_snapshot(engine: &Arc<Mutex<RawMutex, MatchingEngine>>) {
    let dir = PathBuf::from("snapshots");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    let ts = Utc::now().timestamp_millis();
    let filename = format!("snapshots/{}.json", ts);
    let mut orderbooks = serde_json::Map::new();
    for (outcome_id, book) in engine.lock().books.iter() {
        let (bids, asks) = book.depth_levels(usize::MAX);
        orderbooks.insert(
            outcome_id.clone(),
            serde_json::json!({
                "bids": bids,
                "asks": asks,
            }),
        );
    }
    let snapshot = Snapshot {
        timestamp: ts,
        orderbooks: serde_json::Value::Object(orderbooks),
    };
    let json_str = serde_json::to_string_pretty(&snapshot).unwrap();
    if let Err(err) = async_fs::write(&filename, json_str).await {
        eprintln!("Failed to write snapshot: {:?}", err);
    } else {
        println!("Wrote snapshot: {}", filename);
    }
}
