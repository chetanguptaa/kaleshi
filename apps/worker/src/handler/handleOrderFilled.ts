import "dotenv/config";
import { prisma } from "../prisma";
import { OrderFilledEvent } from "../types/index";

export async function handleOrderFilled(event: OrderFilledEvent) {
  const { order_id, account_id } = event;
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order_id, accountId: account_id },
      data: { status: "FILLED" },
    });
    const order = await tx.order.findUnique({
      where: { id: order_id },
    });
    if (order) {
      await tx.account.update({
        where: { id: account_id },
        data: {
          reservedCoins: {
            decrement: order.price * order.quantity * 100,
          },
        },
      });
    }
  });
  console.log(`Processed fill for order_id ${order_id}`);
}
