use crate::engine::engine::MatchingEngine;
use crate::engine::stream::start_order_stream_loop;
use parking_lot::RawMutex;
use parking_lot::lock_api::Mutex;
use std::sync::Arc;

pub async fn start_redis_listener(
    engine: Arc<Mutex<RawMutex, MatchingEngine>>,
    redis_url: String,
) -> redis::RedisResult<()> {
    start_order_stream_loop(redis_url, engine).await?;
    Ok(())
}
