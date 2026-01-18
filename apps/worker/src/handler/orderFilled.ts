import "dotenv/config";
import { OrderFilledEvent } from "src/types";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

export default async function handleOrderFill(event: OrderFilledEvent) {
  const {
    fill_id,
    buy_order_id,
    sell_order_id,
    buyer_account_id,
    seller_account_id,
    price,
    quantity,
    timestamp,
  } = event;
  const totalValue = price * quantity;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.fill.findUnique({
      where: { id: fill_id },
    });
    if (existing) return;
    const buyer = await tx.account.findUnique({
      where: { id: buyer_account_id },
      select: { coins: true },
    });
    if (!buyer) throw new Error("Buyer account not found");
    if (buyer.coins < totalValue) {
      console.error(
        `FATAL: insufficient balance buyer=${buyer_account_id} has=${buyer.coins} needs=${totalValue}`,
      );
      throw new Error("Insufficient funds to apply fill");
    }
    await tx.fill.create({
      data: {
        id: fill_id,
        price,
        quantity,
        buyerOrderId: buy_order_id,
        sellerOrderId: sell_order_id,
        buyerAccountId: buyer_account_id,
        sellerAccountId: seller_account_id,
        createdAt: new Date(timestamp),
      },
    });
    await tx.account.update({
      where: { id: buyer_account_id },
      data: { coins: { decrement: totalValue } },
    });
    await tx.account.update({
      where: { id: seller_account_id },
      data: { coins: { increment: totalValue } },
    });
    await tx.order.updateMany({
      where: { id: buy_order_id },
      data: { quantity: { decrement: quantity }, status: "PARTIAL" },
    });
    await tx.order.updateMany({
      where: { id: sell_order_id },
      data: { quantity: { decrement: quantity }, status: "PARTIAL" },
    });
    await tx.order.updateMany({
      where: { id: buy_order_id, quantity: 0 },
      data: { status: "FILLED" },
    });
    await tx.order.updateMany({
      where: { id: sell_order_id, quantity: 0 },
      data: { status: "FILLED" },
    });
  });
  console.log(`Processed fill: ${fill_id} qty=${quantity} @ ${price}`);
}
