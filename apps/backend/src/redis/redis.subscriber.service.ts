import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_SUBSCRIBER, ENGINE_EVENT_CHANNEL } from './redis.constants';
import { EngineEvent } from './redis.event-types';
import { WsGateway } from 'src/websocket/ws.gateway';

@Injectable()
export class RedisSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(RedisSubscriberService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER)
    private readonly subscriber: RedisClientType,
    private readonly gateway: WsGateway,
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
      this.logger.debug(`Received engine event: ${event.type}`);
      switch (event.type) {
        case 'book.depth': {
          this.gateway.broadcastDepth(event.outcome_id, {
            bids: event.bids,
            asks: event.asks,
            ts: event.timestamp,
          });
          break;
        }
        case 'order.partial': {
          this.gateway.broadcastOrderPartial(event.account_id, {
            remaining: event.remaining,
            outcomeId: event.outcome_id,
            ts: event.timestamp,
          });
          break;
        }
        case 'order.filled': {
          this.gateway.broadcastFill(
            event.buyer_account_id,
            event.seller_account_id,
            {
              fillId: event.fill_id,
              buyOrderId: event.buy_order_id,
              sellOrderId: event.sell_order_id,
              buyer: event.buyer_account_id,
              seller: event.seller_account_id,
              price: event.price,
              qty: event.quantity,
              ts: event.timestamp,
            },
          );
          break;
        }
        case 'order.cancelled': {
          this.gateway.broadcastCancel(event.account_id, {
            outcomeId: event.outcome_id,
            ts: event.timestamp,
          });
          break;
        }
        case 'market.data': {
          this.gateway.broadcastMarketData(event.market_id, {
            market_id: event.market_id,
            outcomes: event.outcomes,
            timestamp: event.timestamp,
          });
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
