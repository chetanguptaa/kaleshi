import { OrderSide } from "../../generated/prisma/enums";
import { prisma } from "../prisma";
import { OrderPlacedEvent } from "../types/index";

export async function handleOrderPlaced(event: OrderPlacedEvent) {
  await prisma.order.upsert({
    where: {
      id: event.order_id,
    },
    update: {
      accountId: event.account_id,
      outcomeId: event.outcome_id,
      side:
        event.side.toLowerCase() === OrderSide.Buy.toLowerCase()
          ? OrderSide.Buy
          : OrderSide.Sell,
      price: event.price,
      quantity: event.quantity,
      originalQuantity: event.quantity,
      status: "OPEN",
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
      quantity: event.quantity,
      originalQuantity: event.quantity,
      status: "OPEN",
    },
  });
}
