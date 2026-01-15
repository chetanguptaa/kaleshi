use super::order::{Order, Side};
use crate::engine::{fill::FillEvent, order::OrderType};
use chrono::Utc;
use std::collections::{BTreeMap, VecDeque};
use uuid::Uuid;

#[derive(Clone)]
pub struct OrderBook {
    pub bids: BTreeMap<u32, VecDeque<Order>>,
    pub asks: BTreeMap<u32, VecDeque<Order>>,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
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
                    if incoming.order_type == OrderType::LIMIT
                        && incoming.price.unwrap() < best_ask_price
                    {
                        break;
                    }
                    let ask_queue = self.asks.get_mut(&best_ask_price).unwrap();
                    let resting = ask_queue.front_mut().unwrap();
                    let traded_qty = resting.qty_remaining.min(incoming.qty_remaining);
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
                        market_id: incoming.market_id,
                        outcome_id: incoming.outcome_id.clone(),
                        timestamp: Utc::now().timestamp_millis(),
                    };
                    fills.push(fill);
                    incoming.qty_remaining -= traded_qty;
                    resting.qty_remaining -= traded_qty;
                    if resting.qty_remaining == 0 {
                        ask_queue.pop_front();
                        if ask_queue.is_empty() {
                            self.asks.remove(&best_ask_price);
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

            Side::SELL => {
                loop {
                    let best_bid_price = match self.best_bid() {
                        Some(p) => p,
                        None => break,
                    };
                    if incoming.order_type == OrderType::LIMIT
                        && incoming.price.unwrap() > best_bid_price
                    {
                        break;
                    }
                    let bid_queue = self.bids.get_mut(&best_bid_price).unwrap();
                    let resting = bid_queue.front_mut().unwrap();
                    let traded_qty = resting.qty_remaining.min(incoming.qty_remaining);
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
                        market_id: incoming.market_id,
                        outcome_id: incoming.outcome_id.clone(),
                        timestamp: Utc::now().timestamp_millis(),
                    };
                    fills.push(fill);
                    incoming.qty_remaining -= traded_qty;
                    resting.qty_remaining -= traded_qty;
                    if resting.qty_remaining == 0 {
                        bid_queue.pop_front();
                        if bid_queue.is_empty() {
                            self.bids.remove(&best_bid_price);
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
        }
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
}
