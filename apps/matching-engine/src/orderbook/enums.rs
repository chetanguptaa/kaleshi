//! Common enumerations used throughout the order book engine.
//!
//! This module defines order types, sides, statuses, and time-in-force policies
//! used to describe and control order behavior.

use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::orderbook::{LimitOrderOptions, MarketOrderOptions, OrderId, Price, Quantity};

/// Represents the type of order being placed.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrderType {
    /// A market order that matches immediately against available liquidity.
    Market,
    /// A limit order that rests on the book until matched or canceled.
    Limit,
    // StopMarket,
    // StopLimit,
    // OCO
}

/// Represents the side of an order: buy or sell.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    /// Buy side (bids)
    Buy,
    /// Sell side (asks)
    Sell,
}

/// Specifies how long an order remains active before it is executed or expires.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum TimeInForce {
    /// Good-til-cancelled: the order remains until manually canceled.
    GTC,
    /// Immediate-or-cancel: the order executes partially or fully, then cancels.
    IOC,
    /// Fill-or-kill: the order must fill entirely or be canceled.
    FOK,
}

impl FromStr for TimeInForce {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "GTC" => Ok(TimeInForce::GTC),
            "IOC" => Ok(TimeInForce::IOC),
            "FOK" => Ok(TimeInForce::FOK),
            _ => Err(format!("Invalid time-in-force: {}", s)),
        }
    }
}

/// Represents the current status of an order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrderStatus {
    /// The order has been accepted but not yet matched.
    New,
    /// The order was partially matched, some quantity remains.
    PartiallyFilled,
    /// The order was completely matched.
    Filled,
    /// The order was canceled before being fully filled.
    Canceled,
    /// The order was rejected due to invalid input or constraints.
    Rejected,
}

/// Represents the type of operation recorded in the order book journal.
///
/// This enum provides a type-safe and explicit way to indicate which kind of
/// operation was logged—such as a market order, limit order, or cancellation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum JournalOp {
    /// Market order
    Market,
    /// Limit order
    Limit,
    /// Modify order (cancel and create new order with updated price and quantity)
    Modify,
    /// Cancel (delete) order
    Cancel,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderOptions {
    Market(MarketOrderOptions),
    Limit(LimitOrderOptions),
    Modify {
        id: OrderId,
        price: Option<Price>,
        quantity: Option<Quantity>,
    },
    Cancel(OrderId),
}
