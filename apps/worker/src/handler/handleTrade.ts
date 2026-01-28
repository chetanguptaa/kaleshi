import { OrderSide } from "generated/prisma/enums";
import { prisma } from "../prisma";
import { TradeEvent } from "../types/index";

export async function handleTrade(event: TradeEvent) {
  await prisma.$transaction(async (tx) => {
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
    const tradeCost = event.price * event.quantity * 100;
    await tx.account.update({
      where: { id: event.account_id },
      data: {
        coins: { decrement: tradeCost },
        reservedCoins: { decrement: tradeCost },
      },
    });
    await tx.account.update({
      where: { id: event.filled_account_id },
      data: {
        coins: { increment: tradeCost },
        reservedCoins: { decrement: tradeCost },
      },
    });
  });
}
