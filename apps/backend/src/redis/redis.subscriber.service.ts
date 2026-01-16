import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_SUBSCRIBER, ENGINE_EVENT_CHANNEL } from './redis.constants';
import { EngineEvent } from './redis.event-types';

@Injectable()
export class RedisSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(RedisSubscriberService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER)
    private readonly subscriber: RedisClientType,
  ) {}

  async onModuleInit() {
    await this.subscriber.subscribe(ENGINE_EVENT_CHANNEL, (message: string) => {
      let event: EngineEvent | null = null;
      try {
        event = JSON.parse(message) as EngineEvent;
      } catch (e) {
        console.log('parsing error ', e);
      }
      if (event) {
        this.handleIncoming(event);
      }
    });
    this.logger.log(`Subscribed to ${ENGINE_EVENT_CHANNEL}`);
  }

  private handleIncoming(event: EngineEvent) {
    try {
      // TODO:
      // - route to a FillService
      // - route to OrderStatusService
      // - broadcast WebSocket

      this.logger.debug(`Received engine event: ${event.type}`);
      // Example:
      // if (event.type === 'order.filled') await this.fillService.process(event);
      // and so on...
    } catch (err) {
      this.logger.error(`Error handling Redis event`, err);
    }
  }

  onModuleDestroy() {
    return this.subscriber.quit();
  }
}
