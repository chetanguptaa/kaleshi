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
        match incoming.side {
            Side::BUY => {
                loop {
                    let best_ask_price = match self.best_ask() {
                        Some(p) => p,
                        None => break,
                    };
                    self.last_trade_prices.push(best_ask_price);
                    if incoming.order_type == OrderType::LIMIT
                        && incoming.price.unwrap() < best_ask_price
                    {
                        break;
                    }
                    let ask_queue = self.asks.get_mut(&best_ask_price).unwrap();
                    let resting = ask_queue.front_mut().unwrap();
                    let traded_qty = resting.qty_remaining.min(incoming.qty_remaining);
                    self.total_volume += traded_qty as u64;
                    self.total_notional += (best_ask_price as u64) * (traded_qty as u64);
                    let fill = FillEvent {
                        fill_id: Uuid::new_v4().to_string(),
                        buy_order_id: if incoming.side == Side::BUY {
                            incoming.order_id.clone()
                        } else {
                            resting.order_id.clone()
                        },
                        sell_order_id: if incoming.side == Side::SELL {
                            incoming.order_id.clone()
                        } else {
                            resting.order_id.clone()
                        },
                        buyer_account_id: incoming.account_id.clone(),
                        seller_account_id: resting.account_id.clone(),
                        price: best_ask_price,
                        quantity: traded_qty,
                        outcome_id: incoming.outcome_id.clone(),
                        timestamp: Utc::now().timestamp_millis(),
                    };
                    fills.push(fill);
                    incoming.qty_remaining -= traded_qty;
                    resting.qty_remaining -= traded_qty;
                    if resting.qty_remaining == 0.0 {
                        ask_queue.pop_front();
                        if ask_queue.is_empty() {
                            self.asks.remove(&best_ask_price);
                        }
                    }
                    if incoming.qty_remaining == 0.0 {
                        return (fills, None);
                    }
                }
                if incoming.order_type == OrderType::LIMIT && incoming.qty_remaining > 0.0 {
                    return (fills, Some(incoming));
                }
                (fills, None)
            }

            Side::SELL => {
                loop {
                    let best_bid_price = match self.best_bid() {
                        Some(p) => p,
                        None => break,
                    };
                    self.last_trade_prices.push(best_bid_price);
                    if incoming.order_type == OrderType::LIMIT
                        && incoming.price.unwrap() > best_bid_price
                    {
                        break;
                    }
                    let bid_queue = self.bids.get_mut(&best_bid_price).unwrap();
                    let resting = bid_queue.front_mut().unwrap();
                    let traded_qty = resting.qty_remaining.min(incoming.qty_remaining);
                    self.total_volume += traded_qty as u64;
                    self.total_notional += (best_bid_price as u64) * (traded_qty as u64);
                    let fill = FillEvent {
                        fill_id: Uuid::new_v4().to_string(),
                        buy_order_id: if incoming.side == Side::BUY {
                            incoming.order_id.clone()
                        } else {
                            resting.order_id.clone()
                        },
                        sell_order_id: if incoming.side == Side::SELL {
                            incoming.order_id.clone()
                        } else {
                            resting.order_id.clone()
                        },
                        buyer_account_id: resting.account_id.clone(),
                        seller_account_id: incoming.account_id.clone(),
                        price: best_bid_price,
                        quantity: traded_qty,
                        outcome_id: incoming.outcome_id.clone(),
                        timestamp: Utc::now().timestamp_millis(),
                    };
                    fills.push(fill);
                    incoming.qty_remaining -= traded_qty;
                    resting.qty_remaining -= traded_qty;
                    if resting.qty_remaining == 0.0 {
                        bid_queue.pop_front();
                        if bid_queue.is_empty() {
                            self.bids.remove(&best_bid_price);
                        }
                    }
                    if incoming.qty_remaining == 0.0 {
                        return (fills, None);
                    }
                }
                if incoming.order_type == OrderType::LIMIT && incoming.qty_remaining > 0.0 {
                    return (fills, Some(incoming));
                }
                (fills, None)
            }
        }
    }

    pub fn depth_levels(&self, max_levels: usize) -> (Vec<(u32, f32)>, Vec<(u32, f32)>) {
        let mut bids = Vec::new();
        for (price, queue) in self.bids.iter().rev() {
            let qty: f32 = queue.iter().map(|o| o.qty_remaining).sum();
            bids.push((*price, qty));
            if bids.len() >= max_levels {
                break;
            }
        }
        let mut asks = Vec::new();
        for (price, queue) in self.asks.iter() {
            let qty: f32 = queue.iter().map(|o| o.qty_remaining).sum();
            asks.push((*price, qty));
            if asks.len() >= max_levels {
                break;
            }
        }
        (bids, asks)
    }
}
