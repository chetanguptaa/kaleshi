use super::order::Order;
use super::orderbook::OrderBook;
use crate::engine::events::EngineEvent;
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct MatchingEngine {
    pub books: HashMap<String, OrderBook>, // Pointer: Key is outcome_id
    pub market_outcomes: HashMap<u32, Vec<String>>, // market -> outcomes mapping
}

impl MatchingEngine {
    pub fn new() -> Self {
        Self {
            books: HashMap::new(),
            market_outcomes: HashMap::new(),
        }
    }

    pub fn get_or_create_book(
        &mut self,
        outcome_id: &str,
        market_id: &u32,
        ticker: &str,
        outcome_name: &str,
    ) -> &mut OrderBook {
        let orderbook = self
            .books
            .entry(outcome_id.to_string())
            .or_insert_with(|| OrderBook::new(outcome_name, ticker));
        let outcomes = self
            .market_outcomes
            .entry(*market_id)
            .or_insert_with(Vec::new);
        if !outcomes.iter().any(|id| id == outcome_id) {
            outcomes.push(outcome_id.to_string());
        }
        orderbook
    }

    pub fn decide_new_order(&mut self, order: &Order) -> Vec<EngineEvent> {
        let mut events = Vec::new();
        let book = self
            .books
            .entry(order.outcome_id.clone())
            .or_insert_with(|| OrderBook::new(&order.outcome_name, &order.ticker));
        let (fills, remainder) = book.match_order(&mut order);
        for fill in fills {
            events.push(EngineEvent::OrderFilled {
                fill_id: fill.fill_id,
                outcome_id: fill.outcome_id,
                buy_order_id: fill.buy_order_id,
                sell_order_id: fill.sell_order_id,
                buyer_account_id: fill.buyer_account_id,
                seller_account_id: fill.seller_account_id,
                price: fill.price,
                quantity: fill.quantity,
                timestamp: fill.timestamp,
            });
        }
        if let Some(resting) = remainder {
            events.push(EngineEvent::OrderPartial {
                order_id: resting.order_id.clone(),
                account_id: resting.account_id.clone(),
                remaining: resting.qty_remaining,
                original_quantity: resting.qty_original,
                timestamp: chrono::Utc::now().timestamp_millis(),
            });
            events.push(EngineEvent::OrderAdded { order: resting });
        }
        events
    }

    pub fn apply(&mut self, event: &EngineEvent) {
        match event {
            EngineEvent::OrderAdded { order } => {
                let book = self.get_or_create_book(
                    &order.outcome_id,
                    &order.market_id,
                    &order.ticker,
                    &order.outcome_name,
                );
                book.add_order(order.clone());
            }
            EngineEvent::OrderCancelled {
                order_id,
                account_id,
                ..
            } => {
                self.find_and_remove(order_id, account_id);
            }
            _ => {
                // all other events are projection-only
            }
        }
    }

    pub fn decide_cancel(
        &self,
        order_id: &str,
        account_id: &str,
    ) -> Result<Vec<EngineEvent>, anyhow::Error> {
        let exists = self
            .books
            .values()
            .any(|book| book.contains(order_id, account_id));
        if !exists {
            return Err(anyhow::anyhow!("order not found"));
        }
        Ok(vec![EngineEvent::OrderCancelled {
            order_id: order_id.to_string(),
            account_id: account_id.to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }])
    }

    fn find_and_remove(&mut self, order_id: &str, account_id: &str) -> Option<String> {
        for (outcome_id, book) in self.books.iter_mut() {
            // Bids
            let mut to_remove: Option<u32> = None;
            for (price, queue) in book.bids.iter_mut() {
                if let Some(pos) = queue
                    .iter()
                    .position(|o| o.order_id == order_id && o.account_id == account_id)
                {
                    queue.remove(pos);
                    if queue.is_empty() {
                        to_remove = Some(*price);
                    }
                    break;
                }
            }
            if let Some(price) = to_remove {
                book.bids.remove(&price);
                return Some(outcome_id.clone());
            }
            // Asks
            let mut to_remove: Option<u32> = None;
            for (price, queue) in book.asks.iter_mut() {
                if let Some(pos) = queue
                    .iter()
                    .position(|o| o.order_id == order_id && o.account_id == account_id)
                {
                    queue.remove(pos);
                    if queue.is_empty() {
                        to_remove = Some(*price);
                    }
                    break;
                }
            }
            if let Some(price) = to_remove {
                book.asks.remove(&price);
                return Some(outcome_id.clone());
            }
        }
        None
    }

    pub fn market_probabilities(&self, outcomes: &Vec<String>) -> Vec<(String, f64)> {
        let mut raw_probs = Vec::new();
        for outcome_id in outcomes {
            let orderbook = self.books.get(outcome_id);
            if let Some(book) = orderbook {
                let price = book.representative_price().unwrap_or(0);
                raw_probs.push((outcome_id.clone(), price as f64 / 100.0));
            }
        }
        let sum: f64 = raw_probs.iter().map(|(_, p)| p).sum();
        if sum == 0.0 {
            return raw_probs.into_iter().map(|(id, _)| (id, 0.0)).collect();
        }
        raw_probs.into_iter().map(|(id, p)| (id, p / sum)).collect()
    }

    pub fn find_outcome(&self, order_id: &str) -> Option<String> {
        for (outcome_id, book) in &self.books {
            if book.contains(order_id, "") {
                return Some(outcome_id.clone());
            }
        }
        None
    }
}
