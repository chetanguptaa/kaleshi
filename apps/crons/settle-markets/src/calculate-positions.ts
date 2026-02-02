import { db } from ".";

export async function calculatePositionsFromFills(marketId: number) {
  const winningOutcome = await db("Outcome")
    .where({ marketId, winningOutcome: true })
    .first();
  if (!winningOutcome) {
    throw new Error("No winning outcome set");
  }
  const fills = await db("Fill")
    .join("Order", "Fill.orderId", "Order.id")
    .where("Order.outcomeId", winningOutcome.id)
    .select("Fill.*");
  const positions = new Map<number, number>();
  for (const fill of fills) {
    const buyerShares = positions.get(fill.accountId) || 0;
    positions.set(fill.accountId, buyerShares + fill.quantity);
    const sellerShares = positions.get(fill.filledAccountId) || 0;
    positions.set(fill.filledAccountId, sellerShares - fill.quantity);
  }
  const winnerPositions = new Map<number, number>();
  for (const [accountId, shares] of positions) {
    if (shares > 0) {
      winnerPositions.set(accountId, shares);
    }
  }
  return winnerPositions;
}
