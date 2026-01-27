import "dotenv/config";
import { createClient } from "redis";
import { EngineEvent, TStreamResponse } from "./types";
import {
  CONSUMER,
  GROUP,
  IDLE_TIME_MS,
  INPUT_STREAM,
  OUTPUT_CHANNEL,
  OUTPUT_STREAM,
  READ_COUNT,
} from "./constants";
import { handleBookDepth } from "./handler/handleBookDepth";

const redis = createClient({ url: process.env.REDIS_URL! });

async function recoverStaleMessages(redis: any) {
  const result = await redis.xAutoClaim(
    INPUT_STREAM,
    GROUP,
    CONSUMER,
    IDLE_TIME_MS,
    "0-0",
    { COUNT: READ_COUNT },
  );
  if (!result || !Array.isArray(result.messages)) return;
  for (const msg of result.messages) {
    await processMessage(redis, msg.id, msg.message.payload);
  }
}

async function processMessage(redis: any, id: string, payload: string) {
  let event: EngineEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    await redis.xAck(INPUT_STREAM, GROUP, id);
    return;
  }
  try {
    switch (event.type) {
      case "book.depth": {
        await handleBookDepth(event);
        break;
      }
    }
    await redis.xAck(INPUT_STREAM, GROUP, id);
    await redis.xAdd(OUTPUT_STREAM, "*", { payload });
    await redis.publish(OUTPUT_CHANNEL, payload);
  } catch (err) {
    console.error("Processing failed", err);
  }
}

async function ensureGroup() {
  try {
    await redis.xGroupCreate(INPUT_STREAM, GROUP, "0", { MKSTREAM: true });
    console.log("Consumer group created");
  } catch (err: any) {
    if (!err.message.includes("BUSYGROUP")) {
      throw err;
    }
  }
}

async function start() {
  await redis.connect();
  console.log("DB Worker connected to Redis");
  await ensureGroup();
  while (true) {
    await recoverStaleMessages(redis);
    const response = await redis.xReadGroup(
      GROUP,
      CONSUMER,
      [{ key: INPUT_STREAM, id: ">" }],
      { COUNT: 10, BLOCK: 5000 },
    );
    if (!response || !Array.isArray(response)) {
      continue;
    }
    const streams = response as TStreamResponse;
    for (const stream of streams) {
      for (const message of stream.messages) {
        await processMessage(redis, message.id, message.message.payload);
      }
    }
  }
}

start().catch((err) => {
  console.error("Worker failed", err);
  process.exit(1);
});
