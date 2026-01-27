mod engine;
mod error;
mod infra;

use crate::{
    engine::engine::MatchingEngine,
    infra::{
        ledger_replay::replay_ledger, redis_streams::start_command_stream_loop,
        view_emitter::ViewEmitter,
    },
};
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    println!("Starting matching engine (event-sourced)…");
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let mut engine = MatchingEngine::new();
    let redis_client = redis::Client::open(redis_url.clone())?;
    let mut redis_conn = redis_client.get_async_connection().await?;
    {
        replay_ledger(&mut redis_conn, &mut engine).await?;
    }
    println!("Ledger replay completed");
    let view_emitter = ViewEmitter::new(redis_client.get_async_connection().await?);
    start_command_stream_loop(redis_url, engine, view_emitter).await?;
    Ok(())
}
