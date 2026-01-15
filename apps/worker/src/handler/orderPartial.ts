import { prisma } from "src/client";
import { OrderPartialEvent } from "src/types";

export default async function handleOrderPartial(event: OrderPartialEvent) {
  const { orderId, remaining, timestamp } = event;
  await prisma.order.updateMany({
    where: { id: orderId },
    data: {
      quantity: remaining,
      status: remaining > 0 ? "PARTIAL" : "FILLED",
      updatedAt: new Date(timestamp),
    },
  });

  console.log(`Order ${orderId} partial: remaining=${remaining}`);
}
