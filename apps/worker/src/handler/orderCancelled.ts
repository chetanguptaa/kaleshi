import { prisma } from "src/client";
import { OrderCancelledEvent } from "src/types";

export default async function handleOrderCancelled(event: OrderCancelledEvent) {
  const { orderId, timestamp } = event;
  await prisma.order.updateMany({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      updatedAt: new Date(timestamp),
    },
  });

  console.log(`Order ${orderId} cancelled`);
}
