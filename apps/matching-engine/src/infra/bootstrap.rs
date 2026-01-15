use crate::engine::engine::MatchingEngine;
use crate::engine::order::{Order, OrderType, Side};
use sea_orm::{ConnectionTrait, DatabaseConnection, QueryResult, Statement};

pub async fn load_open_orders(
    db: DatabaseConnection,
    engine: &mut MatchingEngine,
) -> anyhow::Result<()> {
    let query = Statement::from_string(
        sea_orm::DatabaseBackend::Sqlite,
        r#"
            SELECT
            id, market_id, outcome_id, account_id, side, order_type, price, quantity, status, created_at
            FROM "Order"
            WHERE status IN ('OPEN', 'PARTIAL')
            ORDER BY created_at ASC")
        "#,
    );
    let rows: Vec<QueryResult> = db.query_all(query).await.unwrap();
    for row in rows {
        let order = Order {
            order_id: row.try_get("", "order_id")?,
            market_id: row.try_get("", "market_id")?,
            outcome_id: row.try_get("", "outcome_id")?,
            account_id: row.try_get("", "account_id")?,
            side: match row.try_get::<String>("", "side")?.as_str() {
                "BUY" => Side::BUY,
                _ => Side::SELL,
            },
            order_type: match row.try_get::<String>("", "order_type")?.as_str() {
                "LIMIT" => OrderType::LIMIT,
                _ => OrderType::MARKET,
            },
            price: row.try_get::<Option<u32>>("", "price")?.map(|p| p as u32),
            qty_remaining: row.try_get::<u32>("", "quantity")? as u32,
            qty_original: row.try_get::<u32>("", "originalQuantity")? as u32,
            timestamp: row
                .try_get::<chrono::NaiveDateTime>("", "created_at")?
                .and_utc()
                .timestamp_millis(),
        };

        engine.handle_recover_order(order);
    }
    Ok(())
}
