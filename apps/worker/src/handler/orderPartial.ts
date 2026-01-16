import { prisma } from "src/client";
import { OrderPartialEvent } from "src/types";

export default async function handleOrderPartial(event: OrderPartialEvent) {
  const { order_id, account_id, remaining, timestamp } = event;
  await prisma.order.updateMany({
    where: { id: order_id, accountId: account_id },
    data: {
      quantity: remaining,
      status: remaining > 0 ? "PARTIAL" : "FILLED",
      updatedAt: new Date(timestamp),
    },
  });

  console.log(`Order ${order_id} partial: remaining=${remaining}`);
}
