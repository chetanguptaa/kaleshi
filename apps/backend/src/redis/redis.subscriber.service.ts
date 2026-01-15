import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_SUBSCRIBER, ENGINE_EVENT_CHANNEL } from './redis.constants';

@Injectable()
export class RedisSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(RedisSubscriberService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER)
    private readonly subscriber: RedisClientType,
  ) {}

  async onModuleInit() {
    await this.subscriber.subscribe(ENGINE_EVENT_CHANNEL, (message) => {
      this.handleIncoming(JSON.parse(message));
    });
    this.logger.log(`Subscribed to ${ENGINE_EVENT_CHANNEL}`);
  }

  private handleIncoming(event: { type: string }) {
    try {
      // TODO:
      // - route to a FillService
      // - route to OrderStatusService
      // - broadcast WebSocket

      this.logger.debug(`Received engine event: ${event.type}`);
      // Example:
      // if (event.type === 'fill.created') await this.fillService.process(event);
      // and so on...
    } catch (err) {
      this.logger.error(`Error handling Redis event`, err);
    }
  }

  onModuleDestroy() {
    return this.subscriber.quit();
  }
}
