import { prisma } from "../prisma";
import { TradeEvent } from "../types/index";

export async function handleTrade(event: TradeEvent) {
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: event.order_id },
      data: {
        status: "FILLED",
      },
    });
    await tx.order.update({
      where: { id: event.filled_order_id },
      data: {
        status: "FILLED",
      },
    });
    await tx.fill.create({
      data: {
        orderId: event.order_id,
        id: event.trade_id,
        filledOrderId: event.filled_order_id,
        accountId: event.account_id,
        filledAccountId: event.filled_account_id,
        price: event.price,
        quantity: event.quantity,
      },
    });
    const tradeCost = event.price * event.quantity;
    await tx.account.update({
      where: { id: event.account_id },
      data: {
        coins: { decrement: tradeCost }, // Pay for the trade
        reservedCoins: { decrement: tradeCost }, // Unreserve
      },
    });
    await tx.account.update({
      where: { id: event.filled_account_id },
      data: {
        coins: { increment: tradeCost }, // Receive payment
        reservedCoins: { decrement: tradeCost }, // Unreserve
      },
    });
  });
}
