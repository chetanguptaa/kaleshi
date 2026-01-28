use super::order::Order;
use crate::engine::{order::OrderType, publish_events::PublishEngineEvent};
use crate::error::{EngineError, EngineResult};
use crate::orderbook::order::AccountId;
use crate::orderbook::{
    ExecutionReport, LimitOrderOptions, MarketOrderOptions, OrderBook, OrderBookBuilder,
    OrderStatus, Price, Quantity, Snapshot, TimeInForce,
};
use redis::aio::Connection;
use redis::{AsyncCommands, RedisError};
use std::collections::HashMap;
use std::env::consts::FAMILY;
use tracing::{debug, error, info};
use uuid::Uuid;

pub struct MatchingEngine {
    pub books: HashMap<String, OrderBook>,
    pub fair_prices: HashMap<String, Price>,
}

impl MatchingEngine {
    pub fn new() -> Self {
        info!("Initializing new MatchingEngine");
        Self {
            books: HashMap::new(),
            fair_prices: HashMap::new(),
        }
    }

    pub fn get_or_create_book(&mut self, outcome_id: &str) -> &mut OrderBook {
        if !self.books.contains_key(outcome_id) {
            debug!("Creating new order book for outcome: {}", outcome_id);
        }
        self.books
            .entry(outcome_id.to_string())
            .or_insert_with(|| OrderBookBuilder::new(outcome_id).build())
    }

    pub async fn order_execution(
        &mut self,
        redis: &mut Connection,
        order: &Order,
    ) -> (
        Vec<PublishEngineEvent>,
        &OrderBook,
        Vec<(String, Option<Price>, Snapshot)>,
    ) {
        let mut events = Vec::new();
        let execution_result = self.execute_order_on_book(order);
        let execution_report = match execution_result {
            Ok(report) => report,
            Err(_) => {
                events.push(PublishEngineEvent::OrderRejected {
                    outcome_id: order.outcome_id.clone(),
                    account_id: AccountId(order.account_id),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(TimeInForce::GTC),
                    quantity: Quantity(order.qty_original),
                });
                let snapshots = self.create_snapshots(redis).await;
                if let Some(book) = self.books.get(&order.outcome_id) {
                    if let Some(fair_price) = Self::compute_fair_price(redis, book).await {
                        self.fair_prices
                            .insert(order.outcome_id.clone(), fair_price);
                    }
                }
                let book = self.books.get(&order.outcome_id).unwrap();
                return (events, book, snapshots);
            }
        };

        dbg!(&execution_report);

        // Process the execution report and create appropriate events
        match execution_report.status {
            OrderStatus::New => {
                events.push(PublishEngineEvent::OrderPlaced {
                    order_id: execution_report.order_id,
                    outcome_id: order.outcome_id.clone(),
                    account_id: AccountId(order.account_id),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(execution_report.time_in_force),
                    quantity: Quantity(order.qty_original),
                });
            }
            OrderStatus::Filled | OrderStatus::PartiallyFilled => {
                for fill in &execution_report.fills {
                    events.push(PublishEngineEvent::Trade {
                        trade_id: Uuid::new_v4().to_string(),
                        account_id: AccountId(order.account_id),
                        outcome_id: order.outcome_id.clone(),
                        order_id: execution_report.order_id,
                        filled_order_id: fill.order_id,
                        filled_account_id: fill.account_id,
                        price: Price(fill.price.0),
                        quantity: Quantity(fill.quantity.0),
                        side: order.side.clone().into(),
                        remaining: Quantity(order.qty_remaining),
                        original_quantity: Quantity(order.qty_original),
                        time_in_force: Some(execution_report.time_in_force),
                    });
                }
                if execution_report.status == OrderStatus::Filled {
                    events.push(PublishEngineEvent::OrderFilled {
                        order_id: execution_report.order_id,
                        outcome_id: order.outcome_id.clone(),
                        account_id: AccountId(order.account_id),
                        side: order.side.clone().into(),
                        price: Price(order.price),
                        time_in_force: Some(execution_report.time_in_force),
                        quantity: Quantity(order.qty_original),
                    });
                } else {
                    events.push(PublishEngineEvent::OrderPartial {
                        order_id: execution_report.order_id,
                        outcome_id: order.outcome_id.clone(),
                        account_id: AccountId(order.account_id),
                        side: order.side.clone().into(),
                        price: Price(order.price),
                        time_in_force: Some(execution_report.time_in_force),
                        quantity: Quantity(order.qty_original),
                        remaining: execution_report.remaining_qty,
                        original_quantity: execution_report.orig_qty,
                    });
                }
            }
            OrderStatus::Canceled => {
                events.push(PublishEngineEvent::OrderCancelled {
                    order_id: execution_report.order_id,
                    outcome_id: order.outcome_id.clone(),
                    account_id: AccountId(order.account_id),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(TimeInForce::GTC),
                    quantity: Quantity(order.qty_original),
                });
            }
            OrderStatus::Rejected => {
                events.push(PublishEngineEvent::OrderRejected {
                    outcome_id: order.outcome_id.clone(),
                    account_id: AccountId(order.account_id),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(TimeInForce::GTC),
                    quantity: Quantity(order.qty_original),
                });
            }
        }

        let snapshots = self.create_snapshots(redis).await;
        let book = self.books.get(&order.outcome_id).unwrap();
        (events, book, snapshots)
    }

    fn execute_order_on_book(&mut self, order: &Order) -> Result<ExecutionReport, EngineError> {
        let book = self.get_or_create_book(&order.outcome_id);
        let execution_report = match order.order_type {
            OrderType::LIMIT => {
                let opts = LimitOrderOptions {
                    price: Price(order.price),
                    time_in_force: Some(TimeInForce::GTC),
                    side: order.side.clone().into(),
                    quantity: Quantity(order.qty_original),
                    post_only: Some(false),
                    account_id: AccountId(order.account_id),
                };
                book.limit(opts).map_err(|e| EngineError::OrderExecution {
                    reason: format!("Limit order failed: {}", e),
                    order_id: None,
                })?
            }
            OrderType::MARKET => {
                let opts = MarketOrderOptions {
                    side: order.side.clone().into(),
                    quantity: Quantity(order.qty_original),
                    account_id: AccountId(order.account_id),
                };
                book.market(opts).map_err(|e| EngineError::OrderExecution {
                    reason: format!("Market order failed: {}", e),
                    order_id: None,
                })?
            }
        };
        Ok(execution_report)
    }

    async fn create_snapshots(
        &self,
        redis: &mut Connection,
    ) -> Vec<(String, Option<Price>, Snapshot)> {
        let mut snapshots = Vec::new();
        for (outcome_id, book) in &self.books {
            let fair_price = Self::compute_fair_price(redis, book).await;
            let snapshot = book.snapshot();
            snapshots.push((outcome_id.clone(), fair_price, snapshot));
        }
        snapshots
    }

    pub fn apply_snapshots(&mut self, snapshots: Vec<(String, Snapshot)>) -> EngineResult<()> {
        info!("Applying {} snapshots to engine", snapshots.len());
        for (outcome_id, snapshot) in snapshots {
            match self.apply_single_snapshot(&outcome_id, snapshot) {
                Ok(_) => {
                    debug!("Successfully applied snapshot for outcome: {}", outcome_id);
                }
                Err(e) => {
                    error!("Failed to apply snapshot for outcome {}: {}", outcome_id, e);
                    return Err(EngineError::Snapshot(format!(
                        "Failed to apply snapshot for outcome {}: {}",
                        outcome_id, e
                    )));
                }
            }
        }
        info!("Successfully applied all snapshots");
        Ok(())
    }

    fn apply_single_snapshot(&mut self, outcome_id: &str, snapshot: Snapshot) -> EngineResult<()> {
        let builder = OrderBookBuilder::new(outcome_id);
        let orderbook_builder = builder.with_snapshot(snapshot);
        let orderbook = orderbook_builder.build();
        self.books.insert(outcome_id.to_string(), orderbook);
        Ok(())
    }

    pub fn stats(&self) -> EngineStats {
        EngineStats {
            total_books: self.books.len(),
            books: self
                .books
                .iter()
                .map(|(outcome_id, book)| {
                    let depth = book.depth(None);
                    (
                        outcome_id.clone(),
                        BookStats {
                            bid_levels: depth.bids.len(),
                            ask_levels: depth.asks.len(),
                        },
                    )
                })
                .collect(),
        }
    }

    async fn compute_fair_price(redis: &mut Connection, book: &OrderBook) -> Option<Price> {
        let depth = book.depth(Some(1));
        let best_bid = depth.bids.first().map(|l| l.0);
        let best_ask = depth.asks.first().map(|l| l.0);
        let fair_price = match (best_bid, best_ask) {
            (Some(bid), Some(ask)) => Some(Price((bid.0 + ask.0) / 2)),
            _ => None,
        };
        if let Some(price) = fair_price {
            let _: Result<String, RedisError> = redis
                .set(format!("fair_price:{}", book.symbol()), price.0.to_string())
                .await;
        }
        fair_price
    }
}

impl Default for MatchingEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics about the matching engine
#[derive(Debug, Clone)]
pub struct EngineStats {
    pub total_books: usize,
    pub books: HashMap<String, BookStats>,
}

/// Statistics about a single order book
#[derive(Debug, Clone)]
pub struct BookStats {
    pub bid_levels: usize,
    pub ask_levels: usize,
}
