use thiserror::Error;

/// Main error type for the matching engine application
#[derive(Error, Debug)]
pub enum EngineError {
    /// Errors from the order book operations
    #[error("Order book error: {0}")]
    OrderBook(#[from] rust_order_book::OrderBookError),

    /// Redis connection and operation errors
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    /// JSON serialization/deserialization errors
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),

    /// Order validation errors
    #[error("Order validation failed: {0}")]
    OrderValidation(String),

    /// Invalid order type
    #[error("Invalid order type: {0}")]
    InvalidOrderType(String),

    /// Missing required field in message
    #[error("Missing required field: {0}")]
    MissingField(String),

    /// Invalid message format
    #[error("Invalid message format: {0}")]
    InvalidMessage(String),

    /// Ledger operation errors
    #[error("Ledger operation failed: {0}")]
    Ledger(String),

    /// Stream processing errors
    #[error("Stream processing error: {0}")]
    StreamProcessing(String),

    /// Configuration errors
    #[error("Configuration error: {0}")]
    Configuration(String),

    /// Order execution errors
    #[error("Order execution failed: {reason}")]
    OrderExecution {
        reason: String,
        order_id: Option<String>,
    },

    /// Snapshot operation errors
    #[error("Snapshot operation failed: {0}")]
    Snapshot(String),

    /// View emission errors
    #[error("Failed to emit view: {0}")]
    ViewEmission(String),

    /// Unknown event type received
    #[error("Unknown event type: {0}")]
    UnknownEventType(String),

    /// Generic internal error
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Result type alias for engine operations
pub type EngineResult<T> = Result<T, EngineError>;

impl EngineError {
    /// Check if the error is retryable
    pub fn is_retryable(&self) -> bool {
        match self {
            // Network and temporary errors are retryable
            EngineError::Redis(_) => true,
            EngineError::StreamProcessing(_) => true,
            EngineError::ViewEmission(_) => true,
            EngineError::Ledger(_) => true,

            // Validation and logic errors are not retryable
            EngineError::OrderValidation(_)
            | EngineError::InvalidOrderType(_)
            | EngineError::MissingField(_)
            | EngineError::InvalidMessage(_)
            | EngineError::Configuration(_)
            | EngineError::UnknownEventType(_) => false,

            // Order book errors might be retryable depending on the error code
            EngineError::OrderBook(_) => false,

            // Other errors need case-by-case analysis
            _ => false,
        }
    }

    /// Get error severity for logging purposes
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            EngineError::Configuration(_) => ErrorSeverity::Critical,
            EngineError::Internal(_) => ErrorSeverity::Critical,

            EngineError::OrderBook(_)
            | EngineError::OrderExecution { .. }
            | EngineError::Ledger(_) => ErrorSeverity::High,

            EngineError::Redis(_) | EngineError::StreamProcessing(_) => ErrorSeverity::Medium,

            EngineError::OrderValidation(_)
            | EngineError::InvalidOrderType(_)
            | EngineError::MissingField(_)
            | EngineError::InvalidMessage(_)
            | EngineError::UnknownEventType(_) => ErrorSeverity::Low,

            _ => ErrorSeverity::Medium,
        }
    }

    /// Convert to a user-facing error message
    pub fn user_message(&self) -> String {
        match self {
            EngineError::OrderValidation(msg) => format!("Order validation failed: {}", msg),
            EngineError::InvalidOrderType(t) => format!("Invalid order type: {}", t),
            EngineError::OrderExecution { reason, order_id } => {
                if let Some(id) = order_id {
                    format!("Order {} failed: {}", id, reason)
                } else {
                    format!("Order execution failed: {}", reason)
                }
            }
            _ => "An internal error occurred. Please try again later.".to_string(),
        }
    }
}

/// Error severity levels for logging and monitoring
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorSeverity {
    Low,      // Expected errors, validation failures
    Medium,   // Temporary failures, network issues
    High,     // Business logic failures that need attention
    Critical, // System failures requiring immediate action
}

impl std::fmt::Display for ErrorSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ErrorSeverity::Low => write!(f, "LOW"),
            ErrorSeverity::Medium => write!(f, "MEDIUM"),
            ErrorSeverity::High => write!(f, "HIGH"),
            ErrorSeverity::Critical => write!(f, "CRITICAL"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_retryability() {
        let redis_error = EngineError::Redis(redis::RedisError::from((
            redis::ErrorKind::IoError,
            "Connection failed",
        )));
        assert!(redis_error.is_retryable());

        let validation_error = EngineError::OrderValidation("Invalid price".to_string());
        assert!(!validation_error.is_retryable());
    }

    #[test]
    fn test_error_severity() {
        let config_error = EngineError::Configuration("Missing config".to_string());
        assert_eq!(config_error.severity(), ErrorSeverity::Critical);

        let validation_error = EngineError::OrderValidation("Invalid price".to_string());
        assert_eq!(validation_error.severity(), ErrorSeverity::Low);
    }

    #[test]
    fn test_user_message() {
        let order_error = EngineError::OrderExecution {
            reason: "Insufficient funds".to_string(),
            order_id: Some("ORDER-123".to_string()),
        };
        assert!(order_error.user_message().contains("ORDER-123"));
        assert!(order_error.user_message().contains("Insufficient funds"));
    }
}
