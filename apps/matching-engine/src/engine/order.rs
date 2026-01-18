use serde::{Deserialize, Serialize};
use std::error::Error;
use std::{fmt, str::FromStr};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Side {
    BUY,
    SELL,
}

#[derive(Debug)]
pub struct ParseOrderSideError;

impl fmt::Display for ParseOrderSideError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "invalid side string")
    }
}

impl Error for ParseOrderSideError {}

impl FromStr for Side {
    type Err = ParseOrderSideError; // Specify your custom error type
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_string().as_str() {
            "BUY" => Ok(Side::BUY),
            "SELL" => Ok(Side::SELL),
            _ => Err(ParseOrderSideError), // Return an error for invalid input
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
    pub order_id: String,
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
    pub order_id: String,
    pub market_id: u32,
    pub ticker: String,
    pub outcome_name: String,
    pub outcome_id: String,
    pub account_id: String,
    pub side: Side,
    pub order_type: OrderType,
    pub price: Option<u32>, // Pointer: None for MARKET
    pub qty_remaining: f32,
    pub qty_original: f32,
}

impl TryFrom<OrderWire> for Order {
    type Error = anyhow::Error;
    fn try_from(w: OrderWire) -> Result<Self, Self::Error> {
        Ok(Order {
            order_id: w.order_id,
            market_id: w.market_id.parse()?,
            ticker: w.ticker,
            outcome_name: w.outcome_name,
            outcome_id: w.outcome_id,
            account_id: w.account_id,
            side: w.side.parse()?,
            order_type: w.order_type.parse()?,
            price: Some(w.price.parse()?),
            qty_remaining: w.qty_remaining.parse()?,
            qty_original: w.qty_original.parse()?,
        })
    }
}
