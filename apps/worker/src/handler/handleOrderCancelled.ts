import "dotenv/config";
import { prisma } from "../prisma";
import { OrderCancelledEvent } from "../types/index";
import { OrderSide } from "../../generated/prisma/enums";

export async function handleOrderCancelled(event: OrderCancelledEvent) {
  const { order_id, account_id } = event;
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.upsert({
      where: { id: order_id, accountId: account_id },
      update: { status: "CANCELLED" },
      create: {
        id: order_id,
        accountId: account_id,
        outcomeId: event.outcome_id,
        side:
          event.side.toLowerCase() === OrderSide.Buy.toLowerCase()
            ? OrderSide.Buy
            : OrderSide.Sell,
        price: event.price,
        quantity: event.quantity,
        originalQuantity: event.quantity,
        status: "CANCELLED",
      },
    });
    await prisma.account.update({
      where: { id: account_id },
      data: {
        reservedCoins: {
          decrement: order.price * order.quantity * 100,
        },
      },
    });
  });
  console.log(`Order ${order_id} cancelled`);
}
