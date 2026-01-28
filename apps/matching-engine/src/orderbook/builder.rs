//! Builder for configuring and constructing an [`OrderBook`].
//!
//! This module provides the [`OrderBookBuilder`] struct, which allows
//! incremental configuration of an [`OrderBook`] before instantiating it.
//!
//! # Example
//! ```rust
//! use rust_order_book::OrderBookBuilder;
//!
//! let ob = OrderBookBuilder::new("BTCUSD")
//!     .with_journaling(true)
//!     .build();
//! ```

use crate::orderbook::{JournalLog, OrderBook, OrderBookOptions, Snapshot};

/// A builder for constructing an [`OrderBook`] with custom options.
///
/// Use this struct to configure optional features such as journaling
/// before creating an [`OrderBook`] instance.
pub struct OrderBookBuilder {
    symbol: String,
    options: OrderBookOptions,
}

impl OrderBookBuilder {
    /// Creates a new builder instance for the given symbol.
    ///
    /// # Parameters
    /// - `symbol`: The market symbol (e.g., `"BTCUSD"`)
    pub fn new(symbol: impl Into<String>) -> Self {
        Self {
            symbol: symbol.into(),
            options: OrderBookOptions::default(),
        }
    }

    /// Sets all options in bulk via an [`OrderBookOptions`] struct.
    ///
    /// This method can be used for advanced configuration.
    pub fn with_options(mut self, options: OrderBookOptions) -> Self {
        self.options = options;
        self
    }

    /// Attaches a snapshot to this builder, so that the constructed [`OrderBook`]
    /// will be restored to the state captured in the snapshot rather than starting
    /// empty.
    ///
    /// # Parameters
    /// - `snapshot`: A previously captured [`Snapshot`] representing the full state
    ///   of an order book at a given point in time.
    ///
    /// # Returns
    /// The builder itself, allowing method chaining.
    pub fn with_snapshot(mut self, snapshot: Snapshot) -> Self {
        self.options.snapshot = Some(snapshot);
        self
    }

    /// Sets a sequence of journal logs to be replayed after snapshot restoration.
    ///
    /// This allows the order book to reconstruct its state by first restoring a snapshot
    /// (if provided) and then applying all operations contained in the logs.
    ///
    /// # Parameters
    /// - `logs`: A vector of [`JournalLog`] entries to replay. Logs should ideally be in
    ///   chronological order (`op_id` ascending), but `replay_logs` will sort them internally.
    ///
    /// # Returns
    /// Returns `self` to allow chaining with other builder methods.
    pub fn with_replay_logs(mut self, logs: Vec<JournalLog>) -> Self {
        self.options.replay_logs = Some(logs);
        self
    }

    /// Enables or disables journaling.
    ///
    /// # Parameters
    /// - `enabled`: `true` to enable journaling
    pub fn with_journaling(mut self, enabled: bool) -> Self {
        self.options.journaling = enabled;
        self
    }

    /// Builds and returns a fully configured [`OrderBook`] instance.
    ///
    /// # Returns
    /// An [`OrderBook`] with the configured options.
    pub fn build(self) -> OrderBook {
        let mut ob = OrderBook::new(self.symbol.as_str(), self.options.clone());
        if let Some(snapshot) = &self.options.snapshot {
            ob.restore_snapshot(snapshot.clone());
        }

        if let Some(logs) = self.options.replay_logs {
            ob.replay_logs(logs).unwrap(); // panic if logs are invalid
        }

        ob
    }
}
