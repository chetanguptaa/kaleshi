import { Injectable, Logger } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { ORDER_COMMANDS_STREAM } from './redis.constants';
import { OrderCancelledEvent, OrderNewEvent } from './redis.event-types';

@Injectable()
export class RedisPublisherService {
  private readonly logger = new Logger(RedisPublisherService.name);
  private client: RedisClientType | null = null;
  constructor() {
    this.client = createClient({ url: process.env.REDIS_URL! });
    this.client.connect().catch((err) => {
      this.logger.error('Redis connection error', err);
    });
  }

  /**
   * Push a command into the Redis Stream for the matching engine.
   * Stream name: orders.commands.stream
   */
  async pushOrderCommand(eventData: OrderNewEvent | OrderCancelledEvent) {
    try {
      const fields: Record<string, string> = Object.fromEntries(
        Object.entries(eventData).map(([k, v]) => [
          k,
          typeof v === 'object' ? JSON.stringify(v) : String(v),
        ]),
      );
      if (this.client) {
        await this.client.xAdd(ORDER_COMMANDS_STREAM, '*', fields);
      }
      this.logger.debug(`Queued order command: ${eventData.type}`);
    } catch (err) {
      this.logger.error(`Failed to queue order command`, err);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      return this.client.quit();
    }
  }
}
