use super::order::Order;
use crate::engine::{order::OrderType, publish_events::PublishEngineEvent};
use crate::error::EngineError;
use crate::orderbook::order::AccountId;
use crate::orderbook::{
    ExecutionReport, LimitOrderOptions, MarketOrderOptions, OrderBook, OrderBookBuilder, OrderId,
    OrderStatus, Price, Quantity, TimeInForce,
};
use redis::aio::Connection;
use redis::{AsyncCommands, RedisError};
use std::collections::BTreeMap;
use tracing::{debug, info};
use uuid::Uuid;

pub struct MatchingEngine {
    pub books: BTreeMap<String, OrderBook>,
    pub fair_prices: BTreeMap<String, Price>,
    pub total_outcome_volumes: BTreeMap<String, Price>, // outcomeId -> u64
    pub is_replay_mode: bool,
}

impl MatchingEngine {
    pub fn new(replay: bool) -> Self {
        info!("Initializing new MatchingEngine");
        Self {
            books: BTreeMap::new(),
            fair_prices: BTreeMap::new(),
            total_outcome_volumes: BTreeMap::new(),
            is_replay_mode: replay,
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
        Vec<(String, Price, Price)>,
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
                    time_in_force: Some(order.time_in_force),
                    quantity: Quantity(order.qty_original),
                });
                let fair_prices_and_total_volumes = self.get_fair_prices_and_total_volumes().await;
                let book = self.books.get(&order.outcome_id).unwrap();
                return (events, book, fair_prices_and_total_volumes);
            }
        };

        let outcome_id = order.outcome_id.clone();
        let total_volume = self
            .total_outcome_volumes
            .get(&outcome_id)
            .unwrap_or(&Price(0));
        let new_total_volume =
            total_volume.clone() + execution_report.executed_qty * execution_report.price;
        self.total_outcome_volumes
            .insert(outcome_id.clone(), new_total_volume);

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
                self.fair_prices
                    .insert(outcome_id.clone(), execution_report.price);
                if !self.is_replay_mode {
                    let _: Result<String, RedisError> = redis
                        .set(
                            format!("fair_price:{}", &order.outcome_id),
                            execution_report.price.0.to_string(),
                        )
                        .await;
                } else {
                    self.fair_prices
                        .insert(outcome_id.clone(), execution_report.price);
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
                for fill in &execution_report.fills {
                    events.push(PublishEngineEvent::Trade {
                        trade_id: self.generate_trade_id(
                            &execution_report.order_id,
                            &fill.order_id,
                            &fill.account_id,
                        ),
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
            }
            OrderStatus::Canceled => {
                events.push(PublishEngineEvent::OrderCancelled {
                    order_id: execution_report.order_id,
                    outcome_id: order.outcome_id.clone(),
                    account_id: AccountId(order.account_id),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(execution_report.time_in_force),
                    quantity: Quantity(order.qty_original),
                });
            }
            OrderStatus::Rejected => {
                events.push(PublishEngineEvent::OrderRejected {
                    outcome_id: order.outcome_id.clone(),
                    account_id: AccountId(order.account_id),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(execution_report.time_in_force),
                    quantity: Quantity(order.qty_original),
                });
            }
        }

        let fair_prices_and_total_volumes = self.get_fair_prices_and_total_volumes().await;
        let book = self.books.get(&order.outcome_id).unwrap();
        (events, book, fair_prices_and_total_volumes)
    }

    fn execute_order_on_book(&mut self, order: &Order) -> Result<ExecutionReport, EngineError> {
        let book = self.get_or_create_book(&order.outcome_id);
        let execution_report = match order.order_type {
            OrderType::LIMIT => {
                let opts = LimitOrderOptions {
                    price: Price(order.price),
                    time_in_force: Some(order.time_in_force),
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

    async fn get_fair_prices_and_total_volumes(&mut self) -> Vec<(String, Price, Price)> {
        let mut fair_prices_and_total_volumes = Vec::new();
        for (outcome_id, _) in &self.books {
            let fair_price = self
                .fair_prices
                .get(outcome_id)
                .copied()
                .unwrap_or(Price(0));
            let total_volume = self
                .total_outcome_volumes
                .get(outcome_id)
                .copied()
                .unwrap_or(Price(0));
            fair_prices_and_total_volumes.push((outcome_id.clone(), fair_price, total_volume));
        }
        fair_prices_and_total_volumes
    }

    fn generate_trade_id(
        &self,
        order_id: &OrderId,
        filled_order_id: &OrderId,
        fill_account_id: &AccountId,
    ) -> String {
        let namespace = Uuid::NAMESPACE_OID;
        let input = format!("{}-{}-{}", order_id, filled_order_id, fill_account_id);
        Uuid::new_v5(&namespace, input.as_bytes()).to_string()
    }

    pub fn stats(&self) -> EngineStats {
        EngineStats {
            total_books: self.books.len(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct EngineStats {
    pub total_books: usize,
}
