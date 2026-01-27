use crate::engine::order::OrderSide;
use rust_order_book::{OrderId, Price, Quantity, TimeInForce};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PublishEngineEvent {
    OrderPlaced {
        order_id: OrderId,
        account_id: String,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
    OrderPartial {
        order_id: OrderId,
        // filled_order_id: OrderId,
        account_id: String,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        remaining: Quantity,
        original_quantity: Quantity,
        time_in_force: Option<TimeInForce>,
    },
    OrderFilled {
        order_id: OrderId,
        // filled_order_id: OrderId,
        account_id: String,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
    OrderCancelled {
        order_id: OrderId,
        account_id: String,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
    OrderRejected {
        account_id: String,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
}
