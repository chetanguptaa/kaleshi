import "dotenv/config";
import { prisma } from "../prisma";
import { OrderPartialEvent } from "../types/index";

export async function handleOrderPartial(event: OrderPartialEvent) {
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: event.order_id },
      data: {
        status: "PARTIAL",
        quantity: event.remaining,
      },
    });
    const filledQty = event.original_quantity - event.remaining;
    await tx.account.update({
      where: { id: event.account_id },
      data: {
        reservedCoins: {
          decrement: event.price * filledQty * 100,
        },
      },
    });
  });
  console.log(`Order ${event.order_id} partial: remaining=${event.remaining}`);
}
