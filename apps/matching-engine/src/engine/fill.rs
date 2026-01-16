use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FillEvent {
    pub fill_id: String,
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub buyer_account_id: String,
    pub seller_account_id: String,
    pub price: u32,
    pub quantity: u32,
    pub outcome_id: String,
    pub timestamp: i64,
}
