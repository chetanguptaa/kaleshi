import "dotenv/config";
import { prisma } from "../prisma";
import { OrderFilledEvent } from "../types/index";
import { OrderSide } from "../../generated/prisma/enums";

export async function handleOrderFilled(event: OrderFilledEvent) {
  const { order_id, account_id } = event;
  await prisma.order.upsert({
    where: { id: order_id, accountId: account_id },
    update: {
      status: "FILLED",
    },
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
      status: "FILLED",
    },
  });
  console.log(`Processed fill for order_id ${order_id}`);
}
