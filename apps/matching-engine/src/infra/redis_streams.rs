use crate::engine::engine::MatchingEngine;
use crate::engine::stream::start_order_stream_loop;
use crate::infra::view_emitter::ViewEmitter;

pub async fn start_command_stream_loop(
    redis_url: String,
    engine: MatchingEngine,
    view_emitter: ViewEmitter,
) -> redis::RedisResult<()> {
    start_order_stream_loop(redis_url, engine, view_emitter).await?;
    Ok(())
}
