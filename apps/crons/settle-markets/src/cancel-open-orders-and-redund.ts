import { db } from ".";

export async function cancelOpenOrdersAndRefund(marketId: number) {
  const outcomes = await db("Outcome").where({ marketId }).select("id");
  const outcomeIds = outcomes.map((o) => o.id);
  const openOrders = await db("Order")
    .whereIn("outcomeId", outcomeIds)
    .where("status", "OPEN");
  for (const order of openOrders) {
    if (order.side === "BUY") {
      const lockedAmount = order.quantity * order.price;
      await db("accounts")
        .where({ id: order.accountId })
        .update({
          coins: db.raw("coins + ?", [lockedAmount]),
          reservedCoins: db.raw("reservedCoins - ?", [lockedAmount]),
        });
    }
    if (order.side === "SELL") {
      // Just cancel - shares are automatically "unlocked"
      // when order status changes from OPEN to CANCELLED
      // No coin refund needed
      // User keeps their shares and gets payout in next step
    }
    await db("orders").where({ id: order.id }).update({ status: "CANCELLED" });
  }
}
