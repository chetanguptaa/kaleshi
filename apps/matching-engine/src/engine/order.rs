use crate::error::{EngineError, EngineResult};
use rust_order_book::Side;
use serde::{Deserialize, Serialize};
use std::{fmt, str::FromStr};
use tracing::{debug, warn};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OrderSide(pub Side);

impl From<OrderSide> for Side {
    fn from(value: OrderSide) -> Self {
        value.0
    }
}

impl fmt::Display for OrderSide {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self.0 {
            Side::Buy => write!(f, "Buy"),
            Side::Sell => write!(f, "Sell"),
        }
    }
}

impl FromStr for OrderSide {
    type Err = EngineError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "BUY" => Ok(OrderSide(Side::Buy)),
            "SELL" => Ok(OrderSide(Side::Sell)),
            _ => {
                warn!("Invalid order side received: {}", s);
                Err(EngineError::OrderValidation(format!(
                    "Invalid order side: '{}'. Must be 'Buy' or 'Sell'",
                    s
                )))
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderType {
    LIMIT,
    MARKET,
}

impl fmt::Display for OrderType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            OrderType::LIMIT => write!(f, "LIMIT"),
            OrderType::MARKET => write!(f, "MARKET"),
        }
    }
}

impl FromStr for OrderType {
    type Err = EngineError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "MARKET" => Ok(OrderType::MARKET),
            "LIMIT" => Ok(OrderType::LIMIT),
            _ => {
                warn!("Invalid order type received: {}", s);
                Err(EngineError::InvalidOrderType(format!(
                    "Invalid order type: '{}'. Must be 'MARKET', 'LIMIT'",
                    s
                )))
            }
        }
    }
}

/// Wire format for incoming orders (from Redis stream)
#[derive(Debug, Clone, Deserialize)]
pub struct OrderWire {
    pub outcome_id: String,
    pub account_id: String,
    pub market_id: String,
    pub outcome_name: String,
    pub side: String,
    pub order_type: String,
    pub price: String,
    pub qty_remaining: String,
    pub qty_original: String,
}

/// Internal order representation with validated fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub market_id: u32,
    pub outcome_name: String,
    pub outcome_id: String,
    pub account_id: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: u64, // In smallest unit (e.g., cents). 0 for pure MARKET orders
    pub qty_remaining: u64,
    pub qty_original: u64,
}

impl Order {
    /// Validate the order fields for business rules
    pub fn validate(&self) -> EngineResult<()> {
        // Validate outcome_id
        if self.outcome_id.is_empty() {
            return Err(EngineError::OrderValidation(
                "outcome_id cannot be empty".to_string(),
            ));
        }
        // Validate account_id
        if self.account_id.is_empty() {
            return Err(EngineError::OrderValidation(
                "account_id cannot be empty".to_string(),
            ));
        }
        // Validate quantities
        if self.qty_original == 0 {
            return Err(EngineError::OrderValidation(
                "qty_original must be greater than 0".to_string(),
            ));
        }
        if self.qty_remaining > self.qty_original {
            return Err(EngineError::OrderValidation(format!(
                "qty_remaining ({}) cannot exceed qty_original ({})",
                self.qty_remaining, self.qty_original
            )));
        }
        // Validate price for LIMIT orders
        if matches!(self.order_type, OrderType::LIMIT) && self.price == 0 {
            return Err(EngineError::OrderValidation(
                "LIMIT orders must have a price greater than 0".to_string(),
            ));
        }
        // Price should be reasonable (add your own bounds)
        const MAX_PRICE: u64 = 1_000_000_000; // 10 million in cents = $100k
        if self.price > MAX_PRICE {
            return Err(EngineError::OrderValidation(format!(
                "Price {} exceeds maximum allowed price of {}",
                self.price, MAX_PRICE
            )));
        }
        // Quantity should be reasonable (add your own bounds)
        const MAX_QUANTITY: u64 = 1_000_000_000; // 1 billion units
        if self.qty_original > MAX_QUANTITY {
            return Err(EngineError::OrderValidation(format!(
                "Quantity {} exceeds maximum allowed quantity of {}",
                self.qty_original, MAX_QUANTITY
            )));
        }
        debug!(
            "Order validation passed - Side: {}, Type: {}, Price: {}, Qty: {}",
            self.side, self.order_type, self.price, self.qty_original
        );
        Ok(())
    }
}

impl TryFrom<OrderWire> for Order {
    type Error = EngineError;
    fn try_from(w: OrderWire) -> Result<Self, Self::Error> {
        let market_id = w.market_id.parse::<u32>().map_err(|e| {
            EngineError::OrderValidation(format!("Invalid market_id '{}': {}", w.market_id, e))
        })?;
        let side = w.side.parse::<OrderSide>()?;
        let order_type = w.order_type.parse::<OrderType>()?;
        let price = w.price.parse::<u64>().map_err(|e| {
            EngineError::OrderValidation(format!("Invalid price '{}': {}", w.price, e))
        })?;
        let qty_remaining = w.qty_remaining.parse::<u64>().map_err(|e| {
            EngineError::OrderValidation(format!(
                "Invalid qty_remaining '{}': {}",
                w.qty_remaining, e
            ))
        })?;
        let qty_original = w.qty_original.parse::<u64>().map_err(|e| {
            EngineError::OrderValidation(format!(
                "Invalid qty_original '{}': {}",
                w.qty_original, e
            ))
        })?;

        let order = Order {
            market_id,
            outcome_name: w.outcome_name,
            outcome_id: w.outcome_id,
            account_id: w.account_id,
            side,
            order_type,
            price,
            qty_remaining,
            qty_original,
        };

        // Validate the constructed order
        order.validate()?;

        debug!(
            "Successfully converted OrderWire to Outcome: {}",
            order.outcome_id
        );

        Ok(order)
    }
}
