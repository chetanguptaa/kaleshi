import { prisma } from "../prisma";
import { OrderPlacedEvent } from "../types/index";

export async function handleOrderPlaced(event: OrderPlacedEvent) {
  await prisma.order.create({
    data: {
      id: event.order_id,
      accountId: event.account_id,
      outcomeId: event.outcome_id,
      side: event.side,
      price: event.price,
      quantity: event.quantity,
      originalQuantity: event.quantity,
      status: "OPEN",
    },
  });
}
