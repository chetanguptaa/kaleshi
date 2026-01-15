mod engine;
mod infra;

use crate::infra::{bootstrap::load_open_orders, snapshot::write_snapshot};
use dotenvy::dotenv;
use engine::engine::MatchingEngine;
use infra::redis_subscriber::start_redis_listener;
use parking_lot::Mutex;
use sea_orm::Database;
use std::env;
use std::{sync::Arc, time::Duration};
use tokio::time::sleep;

#[tokio::main]
async fn main() {
    dotenv().ok();
    println!("Starting matching engine...");

    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let snap_every = env::var("SNAPSHOT_INTERVAL_SECONDS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(30);

    let db = Database::connect(db_url).await.unwrap();
    let engine = Arc::new(Mutex::new(MatchingEngine::new()));
    {
        let mut eng = engine.lock();
        load_open_orders(db, &mut eng).await.unwrap();
    }
    let snapshot_engine = Arc::clone(&engine);
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_secs(snap_every)).await;
            write_snapshot(&snapshot_engine).await;
        }
    });
    let _ = start_redis_listener(engine, redis_url).await;
}
