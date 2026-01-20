import { randomUUID } from "crypto";

export const INPUT_STREAM = "engine.events";
export const OUTPUT_STREAM = "engine.events.processed";
export const OUTPUT_CHANNEL = "engine.events.processed";
export const GROUP = "db-workers";
export const CONSUMER = randomUUID();
export const IDLE_TIME_MS = 60_000; // 1 minute
export const READ_COUNT = 10;
