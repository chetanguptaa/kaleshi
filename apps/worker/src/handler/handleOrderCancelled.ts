import "dotenv/config";
import { prisma } from "../prisma";
import { OrderCancelledEvent } from "../types/index";

export async function handleOrderCancelled(event: OrderCancelledEvent) {
  const { order_id, account_id } = event;
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: order_id, accountId: account_id },
      data: { status: "CANCELLED" },
    });
    await prisma.account.update({
      where: { id: account_id },
      data: {
        reservedCoins: {
          decrement: order.price * order.quantity * 100,
        },
      },
    });
  });
  console.log(`Order ${order_id} cancelled`);
}
