use thiserror::Error;

#[derive(Error, Debug)]
pub enum EngineError {
    #[error("Order book error: {0}")]
    OrderBook(String),
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Order validation failed: {0}")]
    OrderValidation(String),
    #[error("Invalid order type: {0}")]
    InvalidOrderType(String),
    #[error("Missing required field: {0}")]
    MissingField(String),
    #[error("Invalid message format: {0}")]
    InvalidMessage(String),
    #[error("Ledger operation failed: {0}")]
    Ledger(String),
    #[error("Stream processing error: {0}")]
    StreamProcessing(String),
    #[error("Configuration error: {0}")]
    Configuration(String),
    #[error("Order execution failed: {reason}")]
    OrderExecution {
        reason: String,
        order_id: Option<String>,
    },
    #[error("Snapshot operation failed: {0}")]
    Snapshot(String),
    #[error("Failed to emit view: {0}")]
    ViewEmission(String),
    #[error("Unknown event type: {0}")]
    UnknownEventType(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<rust_order_book::OrderBookError> for EngineError {
    fn from(err: rust_order_book::OrderBookError) -> Self {
        EngineError::OrderBook(format!("Code: {}, Message: {}", err.code, err.message))
    }
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

    /// Create an OrderBook error from rust-order-book's OrderBookError with additional context
    pub fn from_orderbook_error(err: rust_order_book::OrderBookError, context: &str) -> Self {
        EngineError::OrderBook(format!(
            "{} - Code: {}, Message: {}",
            context, err.code, err.message
        ))
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
