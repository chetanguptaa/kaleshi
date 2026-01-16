import { prisma } from "src/client";
import { OrderCancelledEvent } from "src/types";

export default async function handleOrderCancelled(event: OrderCancelledEvent) {
  const { order_id, account_id, timestamp } = event;
  await prisma.order.updateMany({
    where: { id: order_id, accountId: account_id },
    data: {
      status: "CANCELLED",
      updatedAt: new Date(timestamp),
    },
  });

  console.log(`Order ${order_id} cancelled`);
}
