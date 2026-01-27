use rust_order_book::Side;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::{fmt, str::FromStr};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OrderSide(pub Side);

impl From<OrderSide> for Side {
    fn from(value: OrderSide) -> Self {
        value.0
    }
}

#[derive(Debug)]
pub struct OrderSideError;

impl fmt::Display for OrderSideError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "invalid side string")
    }
}

impl Error for OrderSideError {}

impl FromStr for OrderSide {
    type Err = OrderSideError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Buy" | "BUY" => Ok(OrderSide(Side::Buy)),
            "Sell" | "SELL" => Ok(OrderSide(Side::Sell)),
            _ => Err(OrderSideError),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderType {
    LIMIT,
    MARKET,
}

#[derive(Debug)]
pub struct ParseOrderTypeError;

impl fmt::Display for ParseOrderTypeError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "invalid order type string")
    }
}

impl Error for ParseOrderTypeError {}

impl FromStr for OrderType {
    type Err = ParseOrderTypeError; // Specify your custom error type
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_string().as_str() {
            "MARKET" => Ok(OrderType::MARKET),
            "LIMIT" => Ok(OrderType::LIMIT),
            _ => Err(ParseOrderTypeError), // Return an error for invalid input
        }
    }
}

#[derive(Deserialize)]
pub struct OrderWire {
    pub outcome_id: String,
    pub account_id: String,
    pub market_id: String,
    pub ticker: String,
    pub outcome_name: String,
    pub side: String,
    pub order_type: String,
    pub price: String,
    pub qty_remaining: String,
    pub qty_original: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub market_id: u32,
    pub ticker: String,
    pub outcome_name: String,
    pub outcome_id: String,
    pub account_id: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: u64, // Pointer: None for MARKET
    pub qty_remaining: u64,
    pub qty_original: u64,
}

impl TryFrom<OrderWire> for Order {
    type Error = anyhow::Error;
    fn try_from(w: OrderWire) -> Result<Self, Self::Error> {
        Ok(Order {
            market_id: w.market_id.parse()?,
            ticker: w.ticker,
            outcome_name: w.outcome_name,
            outcome_id: w.outcome_id,
            account_id: w.account_id,
            side: w.side.parse()?,
            order_type: w.order_type.parse()?,
            price: w.price.parse()?,
            qty_remaining: w.qty_remaining.parse()?,
            qty_original: w.qty_original.parse()?,
        })
    }
}
