use super::order::{Order, Side};
use crate::engine::{fill::FillEvent, order::OrderType};
use chrono::Utc;
use std::collections::{BTreeMap, VecDeque};
use uuid::Uuid;

#[derive(Clone)]
pub struct OrderBook {
    pub bids: BTreeMap<u32, VecDeque<Order>>,
    pub asks: BTreeMap<u32, VecDeque<Order>>,
    pub last_trade_prices: Vec<u32>,
    pub ticker: String,
    pub name: String,
    pub total_volume: u64,
    pub total_notional: u64,
}

impl OrderBook {
    pub fn new(name: &str, ticker: &str) -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
            last_trade_prices: Vec::new(),
            ticker: ticker.to_string(),
            name: name.to_string(),
            total_volume: 0,
            total_notional: 0,
        }
    }

    pub fn best_bid(&self) -> Option<u32> {
        self.bids.keys().rev().next().cloned()
    }

    pub fn best_ask(&self) -> Option<u32> {
        self.asks.keys().next().cloned()
    }

    pub fn add_order(&mut self, order: Order) {
        match order.side {
            Side::BUY => self
                .bids
                .entry(order.price.unwrap())
                .or_default()
                .push_back(order),
            Side::SELL => self
                .asks
                .entry(order.price.unwrap())
                .or_default()
                .push_back(order),
        }
    }

    pub fn match_order(&mut self, mut incoming: Order) -> (Vec<FillEvent>, Option<Order>) {
        let mut fills = Vec::new();
        loop {
            let (price, book_side) = match incoming.side {
                Side::BUY => match self.best_ask() {
                    Some(p) => (p, Side::SELL),
                    None => break,
                },
                Side::SELL => match self.best_bid() {
                    Some(p) => (p, Side::BUY),
                    None => break,
                },
            };
            if incoming.order_type == OrderType::LIMIT {
                let crosses = match incoming.side {
                    Side::BUY => incoming.price.unwrap() >= price,
                    Side::SELL => incoming.price.unwrap() <= price,
                };
                if !crosses {
                    break;
                }
            }
            let queue = match book_side {
                Side::SELL => self.asks.get_mut(&price).unwrap(),
                Side::BUY => self.bids.get_mut(&price).unwrap(),
            };
            let resting = queue.front_mut().unwrap();
            let traded_qty = incoming.qty_remaining.min(resting.qty_remaining);
            if traded_qty <= 0 {
                break;
            }
            self.last_trade_prices.push(price);
            self.total_volume += traded_qty as u64;
            self.total_notional += (price as u64) * (traded_qty as u64);
            let fill = FillEvent {
                fill_id: Uuid::new_v4().to_string(),
                buy_order_id: match incoming.side {
                    Side::BUY => incoming.order_id.clone(),
                    Side::SELL => resting.order_id.clone(),
                },
                sell_order_id: match incoming.side {
                    Side::SELL => incoming.order_id.clone(),
                    Side::BUY => resting.order_id.clone(),
                },
                buyer_account_id: match incoming.side {
                    Side::BUY => incoming.account_id.clone(),
                    Side::SELL => resting.account_id.clone(),
                },
                seller_account_id: match incoming.side {
                    Side::SELL => incoming.account_id.clone(),
                    Side::BUY => resting.account_id.clone(),
                },
                price,
                quantity: traded_qty,
                outcome_id: incoming.outcome_id.clone(),
                timestamp: Utc::now().timestamp_millis(),
            };
            fills.push(fill);
            incoming.qty_remaining -= traded_qty;
            resting.qty_remaining -= traded_qty;
            if resting.qty_remaining == 0 {
                queue.pop_front();
                if queue.is_empty() {
                    match book_side {
                        Side::SELL => self.asks.remove(&price),
                        Side::BUY => self.bids.remove(&price),
                    };
                }
            }
            if incoming.qty_remaining == 0 {
                return (fills, None);
            }
        }
        if incoming.order_type == OrderType::LIMIT && incoming.qty_remaining > 0 {
            return (fills, Some(incoming));
        }
        (fills, None)
    }

    pub fn depth_levels(&self, max_levels: usize) -> (Vec<(u32, u32)>, Vec<(u32, u32)>) {
        let mut bids = Vec::new();
        for (price, queue) in self.bids.iter().rev() {
            let qty: u32 = queue.iter().map(|o| o.qty_remaining).sum();
            bids.push((*price, qty));
            if bids.len() >= max_levels {
                break;
            }
        }
        let mut asks = Vec::new();
        for (price, queue) in self.asks.iter() {
            let qty: u32 = queue.iter().map(|o| o.qty_remaining).sum();
            asks.push((*price, qty));
            if asks.len() >= max_levels {
                break;
            }
        }
        (bids, asks)
    }

    pub fn representative_price(&self) -> Option<u32> {
        match (self.best_bid(), self.best_ask()) {
            (Some(bid), Some(ask)) => Some((bid + ask) / 2),
            (Some(bid), None) => Some(bid),
            (None, Some(ask)) => Some(ask),
            (None, None) => self.last_trade_prices.last().cloned(),
        }
    }
}
