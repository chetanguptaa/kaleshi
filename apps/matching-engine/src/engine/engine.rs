use super::order::Order;
use super::orderbook::OrderBook;
use crate::engine::fill::FillEvent;
use crate::infra::redis_publisher::publish_event;
use serde_json::json;
use std::collections::HashMap;

#[derive(Clone)]
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

    pub fn handle_new_order(&mut self, order: Order) {
        let outcome_id = order.outcome_id.clone();
        let market_id = order.market_id.clone();
        let ticker = order.ticker.clone();
        let outcome_name = order.outcome_name.clone();
        let book = self.get_or_create_book(&outcome_id, &market_id, &ticker, &outcome_name);
        let (fills, remainder) = book.match_order(order);
        dbg!("filles ", &fills);
        dbg!("remainder ", &remainder);
        for fill in fills {
            Self::emit_filled(&fill)
        }
        if let Some(resting) = remainder {
            MatchingEngine::emit_partial(
                &resting.order_id,
                &resting.account_id,
                resting.qty_remaining,
                resting.qty_original,
            );
            let book = self.get_or_create_book(
                &resting.outcome_id,
                &resting.market_id,
                &ticker,
                &outcome_name,
            );
            book.add_order(resting);
        }
        self.emit_market_data(&market_id);
        self.publish_depth(outcome_id);
    }

    pub fn handle_cancel(&mut self, order_id: &str, account_id: &str) {
        if let Some(outcome_id) = self.find_and_remove(order_id, account_id) {
            MatchingEngine::emit_cancelled(order_id, account_id);
            self.publish_depth(outcome_id);
        }
    }

    pub fn handle_recover_order(&mut self, order: Order) {
        let book = self.get_or_create_book(
            &order.outcome_id,
            &order.market_id,
            &order.ticker,
            &order.outcome_name,
        );
        book.add_order(order);
    }

    fn publish_depth(&self, outcome_id: String) {
        if let Some(book) = self.books.get(&outcome_id) {
            let (bids, asks) = book.depth_levels(10);
            let event = serde_json::json!({
                "type": "book.depth",
                "outcome_id": outcome_id,
                "bids": bids,
                "asks": asks,
                "timestamp": chrono::Utc::now().timestamp_millis()
            });
            tokio::spawn(async move {
                crate::infra::redis_publisher::publish_event(&event).await;
            });
        }
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

    fn emit_filled(fill: &FillEvent) {
        let event = json!({
            "type": "order.filled",
            "fill_id": fill.fill_id,
            "buy_order_id": fill.buy_order_id,
            "sell_order_id": fill.sell_order_id,
            "buyer_account_id": fill.buyer_account_id,
            "seller_account_id": fill.seller_account_id,
            "price": fill.price,
            "quantity": fill.quantity,
            "timestamp": fill.timestamp
        });
        tokio::spawn(async move {
            publish_event(&event).await;
        });
    }

    fn emit_partial(order_id: &str, account_id: &str, remaining: u32, original_quantity: u32) {
        let event = json!({
            "type": "order.partial",
            "order_id": order_id,
            "account_id": account_id,
            "remaining": remaining,
            "original_quantity": original_quantity,
            "timestamp": chrono::Utc::now().timestamp_millis()
        });
        let ev = event.clone();
        tokio::spawn(async move {
            publish_event(&ev).await;
        });
    }

    fn emit_cancelled(order_id: &str, account_id: &str) {
        let event = json!({
            "type": "order.cancelled",
            "account_id": account_id,
            "order_id": order_id,
            "timestamp": chrono::Utc::now().timestamp_millis()
        });
        tokio::spawn(async move {
            publish_event(&event).await;
        });
    }

    fn emit_market_data(&self, market_id: &u32) {
        let outcomes = match self.market_outcomes.get(market_id) {
            Some(v) => v,
            None => return,
        };
        let market_probabilities = self.market_probabilities(outcomes);
        let mut outcome_points = Vec::new();
        for outcome_id in outcomes {
            if let Some(book) = self.books.get(outcome_id) {
                if book.last_trade_prices.is_empty() {
                    continue;
                }
                outcome_points.push(json!({
                    "outcome_id": outcome_id,
                    "ticker": book.ticker,
                    "total_volume": book.total_volume,
                    "total_notional": book.total_notional,
                    "prices": book
                        .last_trade_prices
                        .iter()
                        .map(|p| p)
                        .collect::<Vec<_>>(),
                    "outcome_name": book.name,
                }));
            }
        }
        if outcome_points.is_empty() {
            return;
        }
        let event = json!({
            "type": "market.data",
            "market_id": market_id,
            "timestamp": chrono::Utc::now().timestamp_millis(),
            "outcomes": outcome_points,
            "market_probabilities": market_probabilities,
        });
        tokio::spawn(async move {
            publish_event(&event).await;
        });
    }

    fn market_probabilities(&self, outcomes: &Vec<String>) -> Vec<(String, f64)> {
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
}
