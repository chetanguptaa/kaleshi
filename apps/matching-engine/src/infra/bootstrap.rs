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
                id, outcomeId, accountId, side, orderType, price, quantity, status, createdAt
            FROM "Order"
            WHERE status IN ('OPEN', 'PARTIAL')
            ORDER BY createdAt ASC
        "#,
    );
    let rows: Vec<QueryResult> = db.query_all(query).await.unwrap();
    for row in rows {
        let order = Order {
            order_id: row.try_get("", "orderId")?,
            outcome_id: row.try_get("", "outcomeId")?,
            account_id: row.try_get("", "accountId")?,
            side: match row.try_get::<String>("", "side")?.as_str() {
                "BUY" => Side::BUY,
                _ => Side::SELL,
            },
            order_type: match row.try_get::<String>("", "orderType")?.as_str() {
                "LIMIT" => OrderType::LIMIT,
                _ => OrderType::MARKET,
            },
            price: row.try_get::<Option<u32>>("", "price")?.map(|p| p as u32),
            qty_remaining: row.try_get::<u32>("", "quantity")? as u32,
            qty_original: row.try_get::<u32>("", "originalQuantity")? as u32,
        };

        engine.handle_recover_order(order);
    }
    Ok(())
}
