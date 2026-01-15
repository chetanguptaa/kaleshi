import { prisma } from "src/client";
import { OrderFilledEvent } from "src/types";

export default async function handleOrderFill(event: OrderFilledEvent) {
  const {
    fillId,
    buyOrderId,
    sellOrderId,
    buyerAccountId,
    sellerAccountId,
    price,
    quantity,
    timestamp,
  } = event;
  const totalValue = price * quantity;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.fill.findUnique({
      where: { id: fillId },
    });
    if (existing) return;
    await tx.fill.create({
      data: {
        id: fillId,
        price,
        quantity,
        buyerOrderId: buyOrderId,
        sellerOrderId: sellOrderId,
        buyerAccountId,
        sellerAccountId,
        createdAt: new Date(timestamp),
      },
    });
    await tx.account.update({
      where: { id: buyerAccountId },
      data: { coins: { decrement: totalValue } },
    });
    await tx.account.update({
      where: { id: sellerAccountId },
      data: { coins: { increment: totalValue } },
    });
    await tx.order.updateMany({
      where: { id: buyOrderId },
      data: { quantity: { decrement: quantity }, status: "PARTIAL" },
    });
    await tx.order.updateMany({
      where: { id: sellOrderId },
      data: { quantity: { decrement: quantity }, status: "PARTIAL" },
    });
    await tx.order.updateMany({
      where: { id: buyOrderId, quantity: 0 },
      data: { status: "FILLED" },
    });
    await tx.order.updateMany({
      where: { id: sellOrderId, quantity: 0 },
      data: { status: "FILLED" },
    });
  });
  console.log(`Processed fill: ${fillId} qty=${quantity} @ ${price}`);
}
