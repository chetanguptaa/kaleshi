use crate::{
    engine::order::OrderSide,
    orderbook::{OrderId, Price, Quantity, TimeInForce, order::AccountId},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum PublishEngineEvent {
    #[serde(rename = "trade")]
    Trade {
        trade_id: String,
        order_id: OrderId,
        filled_order_id: OrderId,
        filled_account_id: AccountId,
        account_id: AccountId,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        remaining: Quantity,
        original_quantity: Quantity,
        time_in_force: Option<TimeInForce>,
    },
    #[serde(rename = "order.placed")]
    OrderPlaced {
        order_id: OrderId,
        account_id: AccountId,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
    #[serde(rename = "order.partial")]
    OrderPartial {
        order_id: OrderId,
        account_id: AccountId,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        remaining: Quantity,
        original_quantity: Quantity,
        time_in_force: Option<TimeInForce>,
    },
    #[serde(rename = "order.filled")]
    OrderFilled {
        order_id: OrderId,
        account_id: AccountId,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
    #[serde(rename = "order.cancelled")]
    OrderCancelled {
        order_id: OrderId,
        account_id: AccountId,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
    #[serde(rename = "order.rejected")]
    OrderRejected {
        account_id: AccountId,
        outcome_id: String,
        side: OrderSide,
        quantity: Quantity,
        price: Price,
        time_in_force: Option<TimeInForce>,
    },
}
