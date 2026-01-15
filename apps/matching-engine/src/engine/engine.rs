use super::order::Order;
use super::orderbook::OrderBook;
use crate::infra::redis_publisher::publish_event;
use serde_json::json;
use std::collections::HashMap;

#[derive(Clone)]
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
        self.books
            .entry(outcome_id.to_string())
            .or_insert_with(OrderBook::new)
    }
    pub fn handle_new_order(&mut self, order: Order) {
        let market_id = order.market_id;
        let outcome_id = order.outcome_id.clone();
        let book = self.get_or_create_book(&outcome_id);
        let (fills, remainder) = book.match_order(order);
        for fill in fills {
            let event = json!({
                "type": "fill.created",
                "fillId": fill.fill_id,
                "buyOrderId": fill.buy_order_id,
                "sellOrderId": fill.sell_order_id,
                "buyerAccountId": fill.buyer_account_id,
                "sellerAccountId": fill.seller_account_id,
                "price": fill.price,
                "quantity": fill.quantity,
                "marketId": fill.market_id,
                "outcomeId": fill.outcome_id,
                "timestamp": fill.timestamp
            });
            tokio::spawn(async move {
                publish_event(&event).await;
            });
        }
        if let Some(resting) = remainder {
            let book = self.get_or_create_book(&resting.outcome_id);
            book.add_order(resting);
        }
        self.publish_depth(outcome_id, &market_id);
    }

    pub fn handle_cancel(&mut self, order_id: &str, account_id: &str) {
        let (outcome_id, market_id) = match self.find_and_remove(order_id, account_id) {
            Some(pair) => pair,
            None => return, // Pointer: unknown or already filled/cancelled → ignore
        };
        let event = serde_json::json!({
            "type": "order.cancelled",
            "orderId": order_id,
            "accountId": account_id,
            "marketId": market_id,
            "timestamp": chrono::Utc::now().timestamp_millis()
        });
        tokio::spawn(async move {
            crate::infra::redis_publisher::publish_event(&event).await;
        });
        self.publish_depth(outcome_id, &market_id);
    }

    pub fn handle_recover_order(&mut self, order: Order) {
        let book = self.get_or_create_book(&order.outcome_id);
        book.add_order(order);
    }

    fn publish_depth(&self, outcome_id: String, market_id: &i32) {
        if let Some(book) = self.books.get(&outcome_id) {
            let (bids, asks) = book.depth_levels(10);
            let event = serde_json::json!({
                "type": "book.depth",
                "marketId": market_id,
                "bids": bids,
                "asks": asks,
                "timestamp": chrono::Utc::now().timestamp_millis()
            });
            tokio::spawn(async move {
                crate::infra::redis_publisher::publish_event(&event).await;
            });
        }
    }

    fn find_and_remove(&mut self, order_id: &str, account_id: &str) -> Option<(String, i32)> {
        for (outcome_id, book) in self.books.iter_mut() {
            let mut removed_market = None;
            for (price, queue) in book.bids.iter_mut() {
                if let Some(pos) = queue
                    .iter()
                    .position(|o| o.order_id == order_id && o.account_id == account_id)
                {
                    let market_id = queue[pos].market_id;
                    queue.remove(pos);
                    if queue.is_empty() {
                        removed_market = Some((*price, market_id));
                    } else {
                        return Some((outcome_id.clone(), market_id));
                    }
                }
            }
            if let Some((price, market_id)) = removed_market {
                book.bids.remove(&price);
                return Some((outcome_id.clone(), market_id));
            }
            let mut removed_market = None;
            for (price, queue) in book.asks.iter_mut() {
                if let Some(pos) = queue
                    .iter()
                    .position(|o| o.order_id == order_id && o.account_id == account_id)
                {
                    let market_id = queue[pos].market_id;
                    queue.remove(pos);
                    if queue.is_empty() {
                        removed_market = Some((*price, market_id));
                    } else {
                        return Some((outcome_id.clone(), market_id));
                    }
                }
            }
            if let Some((price, market_id)) = removed_market {
                book.asks.remove(&price);
                return Some((outcome_id.clone(), market_id));
            }
        }
        None
    }
}
