use super::order::Order;
use crate::engine::{order::OrderType, publish_events::PublishEngineEvent};
use rust_order_book::{
    LimitOrderOptions, MarketOrderOptions, OrderBook, OrderBookBuilder, OrderStatus, Price,
    Quantity, Snapshot, TimeInForce,
};
use std::collections::HashMap;

pub struct MatchingEngine {
    pub books: HashMap<String, OrderBook>, // Pointer: Key is outcome_id
}

impl MatchingEngine {
    pub fn new() -> Self {
        Self {
            books: HashMap::new(),
        }
    }

    pub fn get_or_create_book(&mut self, outcome_id: &str) -> &mut OrderBook {
        let orderbook = self
            .books
            .entry(outcome_id.to_string())
            .or_insert_with(|| OrderBookBuilder::new(outcome_id).build());
        orderbook
    }

    pub fn order_execution(
        &mut self,
        order: &Order,
    ) -> (Vec<PublishEngineEvent>, &OrderBook, Vec<(String, Snapshot)>) {
        let mut events = Vec::new();
        let execution_report = {
            let book = self.get_or_create_book(&order.outcome_id);
            match order.order_type {
                OrderType::LIMIT => {
                    let opts = LimitOrderOptions {
                        price: Price(order.price),
                        time_in_force: Some(TimeInForce::GTC),
                        side: order.side.clone().into(),
                        quantity: Quantity(order.qty_original),
                        post_only: Some(false),
                    };
                    book.limit(opts).unwrap()
                }
                _ => {
                    let opts = MarketOrderOptions {
                        side: order.side.clone().into(),
                        quantity: Quantity(order.qty_original),
                    };
                    book.market(opts).unwrap()
                }
            }
        };
        match execution_report.status {
            OrderStatus::New => {
                events.push(PublishEngineEvent::OrderPlaced {
                    order_id: execution_report.order_id,
                    outcome_id: order.outcome_id.clone(),
                    account_id: order.account_id.clone(),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(execution_report.time_in_force),
                    quantity: Quantity(order.qty_original),
                });
            }
            OrderStatus::Filled => {
                let fills = execution_report.fills;
                for fill in fills {
                    let event = PublishEngineEvent::OrderFilled {
                        order_id: execution_report.order_id,
                        filled_order_id: fill.order_id,
                        outcome_id: order.outcome_id.clone(),
                        account_id: order.account_id.clone(),
                        side: order.side.clone().into(),
                        price: Price(order.price),
                        time_in_force: Some(execution_report.time_in_force),
                        quantity: Quantity(order.qty_original),
                    };
                    events.push(event);
                }
            }
            OrderStatus::PartiallyFilled => {
                let fills = execution_report.fills;
                for fill in fills {
                    let event = PublishEngineEvent::OrderPartial {
                        order_id: execution_report.order_id,
                        filled_order_id: fill.order_id,
                        outcome_id: order.outcome_id.clone(),
                        account_id: order.account_id.clone(),
                        side: order.side.clone().into(),
                        price: Price(order.price),
                        time_in_force: Some(execution_report.time_in_force),
                        quantity: Quantity(order.qty_original),
                        remaining: execution_report.remaining_qty,
                        original_quantity: execution_report.orig_qty,
                    };
                    events.push(event);
                }
            }
            OrderStatus::Canceled => {
                events.push(PublishEngineEvent::OrderCancelled {
                    order_id: execution_report.order_id,
                    outcome_id: order.outcome_id.clone(),
                    account_id: order.account_id.clone(),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(TimeInForce::GTC),
                    quantity: Quantity(order.qty_original),
                });
            }
            OrderStatus::Rejected => {
                events.push(PublishEngineEvent::OrderRejected {
                    order_id: execution_report.order_id,
                    outcome_id: order.outcome_id.clone(),
                    account_id: order.account_id.clone(),
                    side: order.side.clone().into(),
                    price: Price(order.price),
                    time_in_force: Some(TimeInForce::GTC),
                    quantity: Quantity(order.qty_original),
                });
            }
        }
        let snapshots = self
            .books
            .iter()
            .map(|(outcome_id, book)| (outcome_id.clone(), book.snapshot()))
            .collect();
        let book = self.books.get(&order.outcome_id).unwrap();
        (events, book, snapshots)
    }

    pub fn apply_snapshots(&mut self, snapshots: Vec<(String, Snapshot)>) {
        for (outcome_id, snapshot) in snapshots {
            let orderbook = OrderBookBuilder::new(outcome_id);
            orderbook.with_snapshot(snapshot);
        }
    }
}
