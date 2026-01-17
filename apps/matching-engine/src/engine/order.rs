use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Side {
    BUY,
    SELL,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderType {
    LIMIT,
    MARKET,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub order_id: String,
    pub market_id: u32,
    pub ticker: String,
    pub outcome_name: String,
    pub outcome_id: String,
    pub account_id: String,
    pub side: Side,
    pub order_type: OrderType,
    pub price: Option<u32>, // Pointer: None for MARKET
    pub qty_remaining: u32,
    pub qty_original: u32,
}
