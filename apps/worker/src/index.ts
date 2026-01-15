import "dotenv/config";
import { createClient } from "redis";
import { EngineEvent } from "./types";
import handleOrderFill from "./handler/orderFilled";
import handleOrderPartial from "./handler/orderPartial";
import handleOrderCancelled from "./handler/orderCancelled";

const redis = createClient({ url: process.env.REDIS_URL! });

async function start() {
  await redis.connect();
  console.log("DB Worker connected to Redis...");
  await redis.subscribe("engine.events", async (message) => {
    let event: EngineEvent | null = null;
    try {
      event = JSON.parse(message);
    } catch (err) {
      console.error("Invalid JSON from engine", message);
      return;
    }
    if (!event) {
      console.error("Invalid JSON from engine", message);
      return;
    }
    try {
      switch (event.type) {
        case "order.filled":
          await handleOrderFill(event);
          break;
        case "order.partial":
          await handleOrderPartial(event);
          break;
        case "order.cancelled":
          await handleOrderCancelled(event);
          break;
        default:
          console.log("Unhandled event: ", JSON.stringify(event));
      }
    } catch (err) {
      console.error(`Error processing ${event.type}`, err);
    }
  });
}

start().catch((err) => {
  console.error("Worker failed", err);
  process.exit(1);
});
