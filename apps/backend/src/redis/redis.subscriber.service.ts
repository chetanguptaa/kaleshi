import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import {
  REDIS_SUBSCRIBER,
  ENGINE_EVENT_PROCESSED_CHANNEL,
  ENGINE_EVENT_CHANNEL,
} from './redis.constants';
import { WsGateway } from 'src/websocket/ws.gateway';
import { EngineEvent } from './redis-subscriber.event-types';

@Injectable()
export class RedisSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(RedisSubscriberService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER)
    private readonly subscriber: RedisClientType,
    private readonly gateway: WsGateway,
  ) {}

  async onModuleInit() {
    await this.subscriber.subscribe(
      ENGINE_EVENT_PROCESSED_CHANNEL,
      (message: string) => {
        let event: EngineEvent | null = null;
        try {
          event = JSON.parse(message) as EngineEvent;
        } catch (e) {
          console.log('parsing error ', e);
        }
        if (event) {
          this.handleIncoming(event);
        }
      },
    );
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
    this.logger.log(`Subscribed to ${ENGINE_EVENT_PROCESSED_CHANNEL}`);
    this.logger.log(`Subscribed to ${ENGINE_EVENT_CHANNEL}`);
  }

  private handleIncoming(event: EngineEvent) {
    try {
      this.logger.debug(`Received engine event: ${event.type}`);
      switch (event.type) {
        case 'book.depth': {
          this.gateway.broadcastDepth(event.outcome_id, event);
          break;
        }
        case 'order.partial': {
          console.log('order partial event ', JSON.stringify(event));
          this.gateway.broadcastOrderPartial(event.account_id, event);
          break;
        }
        case 'order.filled': {
          console.log('order partial event ', JSON.stringify(event));
          this.gateway.broadcastFill(event.account_id, event);
          break;
        }
        case 'order.cancelled': {
          this.gateway.broadcastCancel(event.account_id, event);
          break;
        }
        case 'market.data': {
          console.log('event ', JSON.stringify(event, null, 2));
          this.gateway.broadcastMarketData(event.marketId, event);
          break;
        }
        case 'order.rejected': {
          this.gateway.broadcastOrderRejected(event.account_id, event);
          break;
        }
        case 'order.placed': {
          this.gateway.broadcastOrderPlaced(event.account_id, event);
          break;
        }
        default:
          this.logger.warn(`Unknown event received: ${JSON.stringify(event)}`);
      }
    } catch (err) {
      this.logger.error(`Error handling engine event`, err);
    }
  }

  onModuleDestroy() {
    return this.subscriber.quit();
  }
}
