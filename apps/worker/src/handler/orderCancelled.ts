import "dotenv/config";
import { OrderCancelledEvent } from "src/types";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

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
