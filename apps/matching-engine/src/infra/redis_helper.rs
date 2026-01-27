use crate::error::{EngineError, EngineResult};
use redis::{AsyncCommands, aio::Connection};
use tracing::{debug, error, info, warn};

/// Redis stream utilities with proper error handling
pub struct RedisStreamHelper;

impl RedisStreamHelper {
    /// Create a consumer group, ignoring BUSYGROUP error if it already exists
    pub async fn create_consumer_group(
        conn: &mut Connection,
        stream_key: &str,
        group_name: &str,
    ) -> EngineResult<()> {
        debug!(
            "Creating consumer group '{}' for stream '{}'",
            group_name, stream_key
        );

        let result: Result<(), redis::RedisError> = redis::cmd("XGROUP")
            .arg("CREATE")
            .arg(stream_key)
            .arg(group_name)
            .arg("0")
            .arg("MKSTREAM")
            .query_async(conn)
            .await;

        match result {
            Ok(_) => {
                info!("Consumer group '{}' created successfully", group_name);
                Ok(())
            }
            Err(e) => {
                // BUSYGROUP error means the group already exists, which is fine
                if e.to_string().contains("BUSYGROUP") {
                    debug!("Consumer group '{}' already exists, continuing", group_name);
                    Ok(())
                } else {
                    error!("Failed to create consumer group: {}", e);
                    Err(EngineError::Redis(e))
                }
            }
        }
    }

    /// Acknowledge a message in the stream
    pub async fn ack_message(
        conn: &mut Connection,
        stream_key: &str,
        group_name: &str,
        message_id: &str,
    ) -> EngineResult<()> {
        debug!(
            "Acknowledging message {} in stream {}",
            message_id, stream_key
        );

        let result: Result<i64, redis::RedisError> = redis::cmd("XACK")
            .arg(stream_key)
            .arg(group_name)
            .arg(message_id)
            .query_async(conn)
            .await;

        match result {
            Ok(count) => {
                if count > 0 {
                    debug!("Message {} acknowledged", message_id);
                } else {
                    warn!("Message {} was not found in pending list", message_id);
                }
                Ok(())
            }
            Err(e) => {
                error!("Failed to acknowledge message {}: {}", message_id, e);
                Err(EngineError::Redis(e))
            }
        }
    }

    /// Get pending messages for a consumer
    pub async fn get_pending_messages(
        conn: &mut Connection,
        stream_key: &str,
        group_name: &str,
        consumer_name: &str,
    ) -> EngineResult<Vec<String>> {
        debug!(
            "Getting pending messages for consumer {} in group {}",
            consumer_name, group_name
        );

        // XPENDING returns [count, start_id, end_id, consumers]
        let result: Result<redis::Value, redis::RedisError> = redis::cmd("XPENDING")
            .arg(stream_key)
            .arg(group_name)
            .arg("-")
            .arg("+")
            .arg(100)
            .arg(consumer_name)
            .query_async(conn)
            .await;

        match result {
            Ok(redis::Value::Bulk(items)) => {
                let message_ids: Vec<String> = items
                    .iter()
                    .filter_map(|item| {
                        if let redis::Value::Bulk(details) = item {
                            if let Some(redis::Value::Data(id_bytes)) = details.first() {
                                return Some(String::from_utf8_lossy(id_bytes).into_owned());
                            }
                        }
                        None
                    })
                    .collect();

                info!("Found {} pending messages", message_ids.len());
                Ok(message_ids)
            }
            Ok(_) => {
                debug!("No pending messages found");
                Ok(vec![])
            }
            Err(e) => {
                error!("Failed to get pending messages: {}", e);
                Err(EngineError::Redis(e))
            }
        }
    }

    /// Check if a stream exists
    pub async fn stream_exists(conn: &mut Connection, stream_key: &str) -> EngineResult<bool> {
        let exists: bool = conn
            .exists(stream_key)
            .await
            .map_err(|e| EngineError::Redis(e))?;

        Ok(exists)
    }

    /// Get stream length
    pub async fn get_stream_length(conn: &mut Connection, stream_key: &str) -> EngineResult<usize> {
        let length: usize = redis::cmd("XLEN")
            .arg(stream_key)
            .query_async(conn)
            .await
            .map_err(|e| EngineError::Redis(e))?;

        Ok(length)
    }

    /// Get consumer group info
    pub async fn get_group_info(
        conn: &mut Connection,
        stream_key: &str,
        group_name: &str,
    ) -> EngineResult<GroupInfo> {
        let result: Result<redis::Value, redis::RedisError> = redis::cmd("XINFO")
            .arg("GROUPS")
            .arg(stream_key)
            .query_async(conn)
            .await;

        match result {
            Ok(redis::Value::Bulk(groups)) => {
                for group in groups {
                    if let redis::Value::Bulk(details) = group {
                        let mut name = None;
                        let mut pending = 0;
                        let mut consumers = 0;

                        let mut iter = details.iter();
                        while let (Some(key), Some(value)) = (iter.next(), iter.next()) {
                            if let redis::Value::Data(k) = key {
                                let key_str = String::from_utf8_lossy(k);
                                match key_str.as_ref() {
                                    "name" => {
                                        if let redis::Value::Data(v) = value {
                                            name = Some(String::from_utf8_lossy(v).into_owned());
                                        }
                                    }
                                    "pending" => {
                                        if let redis::Value::Int(p) = value {
                                            pending = *p as usize;
                                        }
                                    }
                                    "consumers" => {
                                        if let redis::Value::Int(c) = value {
                                            consumers = *c as usize;
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }

                        if name.as_deref() == Some(group_name) {
                            return Ok(GroupInfo {
                                name: name.unwrap(),
                                pending,
                                consumers,
                            });
                        }
                    }
                }

                Err(EngineError::Configuration(format!(
                    "Consumer group '{}' not found",
                    group_name
                )))
            }
            Err(e) => {
                error!("Failed to get group info: {}", e);
                Err(EngineError::Redis(e))
            }
        }
    }
}

/// Information about a consumer group
#[derive(Debug, Clone)]
pub struct GroupInfo {
    pub name: String,
    pub pending: usize,
    pub consumers: usize,
}

/// Connection pool helper with retry logic
pub struct RedisConnectionPool {
    client: redis::Client,
}

impl RedisConnectionPool {
    pub fn new(redis_url: &str) -> EngineResult<Self> {
        let client = redis::Client::open(redis_url)
            .map_err(|e| EngineError::Configuration(format!("Invalid Redis URL: {}", e)))?;

        Ok(Self { client })
    }

    /// Get a connection with automatic retry
    pub async fn get_connection(&self) -> EngineResult<Connection> {
        const MAX_RETRIES: usize = 3;
        const RETRY_DELAY_MS: u64 = 1000;

        for attempt in 1..=MAX_RETRIES {
            match self.client.get_async_connection().await {
                Ok(conn) => {
                    debug!("Successfully connected to Redis on attempt {}", attempt);
                    return Ok(conn);
                }
                Err(e) => {
                    if attempt < MAX_RETRIES {
                        warn!(
                            "Failed to connect to Redis (attempt {}/{}): {}. Retrying...",
                            attempt, MAX_RETRIES, e
                        );
                        tokio::time::sleep(std::time::Duration::from_millis(
                            RETRY_DELAY_MS * attempt as u64,
                        ))
                        .await;
                    } else {
                        error!(
                            "Failed to connect to Redis after {} attempts: {}",
                            MAX_RETRIES, e
                        );
                        return Err(EngineError::Redis(e));
                    }
                }
            }
        }

        unreachable!()
    }

    /// Ping Redis to check connection health
    pub async fn health_check(&self) -> EngineResult<()> {
        let mut conn = self.get_connection().await?;

        redis::cmd("PING")
            .query_async::<_, String>(&mut conn)
            .await
            .map_err(|e| EngineError::Redis(e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require a running Redis instance
    // In production, use integration tests with testcontainers

    #[tokio::test]
    #[ignore] // Requires Redis
    async fn test_create_consumer_group() {
        // Setup test Redis connection
        // Test consumer group creation
    }

    #[tokio::test]
    #[ignore]
    async fn test_connection_pool_retry() {
        // Test connection retry logic
    }
}
