use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EngineEvent {
    OrderFilled {
        fill_id: String,
        outcome_id: String,
        buy_order_id: String,
        sell_order_id: String,
        buyer_account_id: String,
        seller_account_id: String,
        price: u32,
        quantity: u32,
        timestamp: i64,
    },
    OrderPartial {
        order_id: String,
        account_id: String,
        remaining: u32,
        original_quantity: u32,
        timestamp: i64,
    },
    OrderCancelled {
        order_id: String,
        account_id: String,
        timestamp: i64,
    },
    OrderAdded {
        order: crate::engine::order::Order,
    },
}
