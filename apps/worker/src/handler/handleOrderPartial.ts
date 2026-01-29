import "dotenv/config";
import { prisma } from "../prisma";
import { OrderPartialEvent } from "../types/index";
import { OrderSide } from "../../generated/prisma/enums";

export async function handleOrderPartial(event: OrderPartialEvent) {
  await prisma.$transaction(async (tx) => {
    await tx.order.upsert({
      where: { id: event.order_id },
      update: {
        status: "PARTIAL",
        quantity: event.remaining,
      },
      create: {
        id: event.order_id,
        accountId: event.account_id,
        outcomeId: event.outcome_id,
        side:
          event.side.toLowerCase() === OrderSide.Buy.toLowerCase()
            ? OrderSide.Buy
            : OrderSide.Sell,
        price: event.price,
        quantity: event.remaining,
        originalQuantity: event.quantity,
        status: "PARTIAL",
      },
    });
    const filledQty = event.original_quantity - event.remaining;
    await tx.account.update({
      where: { id: event.account_id },
      data: {
        reservedCoins: {
          decrement: Math.round((event.price * filledQty) / 100),
        },
      },
    });
  });
  console.log(`Order ${event.order_id} partial: remaining=${event.remaining}`);
}
