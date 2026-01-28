import { prisma } from "../prisma";
import { OrderRejectedEvent } from "../types/index";

export async function handleOrderRejected(event: OrderRejectedEvent) {
  await prisma.account.update({
    where: { id: event.account_id },
    data: {
      reservedCoins: {
        decrement: event.price * event.quantity * 100,
      },
    },
  });
}
