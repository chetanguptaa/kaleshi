mod engine;
mod error;
mod infra;
mod orderbook;

use crate::{
    engine::engine::MatchingEngine,
    error::{EngineError, EngineResult},
    infra::{
        ledger_replay::replay_ledger, redis_streams::start_command_stream_loop,
        view_emitter::ViewEmitter,
    },
};
use dotenvy::dotenv;
use std::env;
use tracing::{error, info, warn};
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

#[tokio::main]
async fn main() -> EngineResult<()> {
    dotenv().ok();
    init_logging()?;
    info!("Starting matching engine (event-sourced)");
    match run_engine().await {
        Ok(_) => {
            info!("Matching engine shut down successfully");
            Ok(())
        }
        Err(e) => {
            error!("Fatal error (severity: {}): {}", e.severity(), e);
            Err(e)
        }
    }
}

fn init_logging() -> EngineResult<()> {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::registry()
        .with(fmt::layer().with_target(true).with_thread_ids(true))
        .with(env_filter)
        .init();
    info!("Logging initialized");
    Ok(())
}

async fn run_engine() -> EngineResult<()> {
    let config = load_configuration()?;
    info!("Configuration loaded successfully");
    let redis_client = create_redis_client(&config.redis_url)?;
    let mut redis_conn = redis_client
        .get_async_connection()
        .await
        .map_err(|e| EngineError::Configuration(format!("Failed to connect to Redis: {}", e)))?;
    {
        info!("Starting ledger replay...");
        let view_emitter_conn = redis_client.get_async_connection().await.map_err(|e| {
            EngineError::Configuration(format!("Failed to create view emitter connection: {}", e))
        })?;
        let mut engine = MatchingEngine::new(true);
        let view_emitter = ViewEmitter::new(view_emitter_conn, true);
        replay_ledger(&mut redis_conn, &mut engine, view_emitter)
            .await
            .map_err(|e| EngineError::Ledger(format!("Ledger replay failed: {}", e)))?;
        let stats = engine.stats();
        info!(
            "Ledger replay completed - {} order books restored",
            stats.total_books
        );
    }
    let view_emitter_conn = redis_client.get_async_connection().await.map_err(|e| {
        EngineError::Configuration(format!("Failed to create view emitter connection: {}", e))
    })?;
    let view_emitter = ViewEmitter::new(view_emitter_conn, false);
    info!("View emitter initialized");
    let engine = MatchingEngine::new(false);
    info!("Starting command stream processing...");
    start_command_stream_loop(config.redis_url, engine, view_emitter)
        .await
        .map_err(|e| EngineError::StreamProcessing(format!("Stream processing failed: {}", e)))?;

    Ok(())
}

#[derive(Debug, Clone)]
struct AppConfig {
    redis_url: String,
}

fn load_configuration() -> EngineResult<AppConfig> {
    let redis_url = env::var("REDIS_URL").map_err(|_| {
        EngineError::Configuration("REDIS_URL environment variable is not set".to_string())
    })?;
    env::var("ENGINE_ID").unwrap_or_else(|_| {
        let default = "engine-1".to_string();
        warn!("ENGINE_ID not set, using default: {}", default);
        default
    });
    if !redis_url.starts_with("redis://") && !redis_url.starts_with("rediss://") {
        return Err(EngineError::Configuration(
            "REDIS_URL must start with redis:// or rediss://".to_string(),
        ));
    }
    Ok(AppConfig { redis_url })
}

fn create_redis_client(redis_url: &str) -> EngineResult<redis::Client> {
    redis::Client::open(redis_url)
        .map_err(|e| EngineError::Configuration(format!("Invalid Redis URL: {}", e)))
}
