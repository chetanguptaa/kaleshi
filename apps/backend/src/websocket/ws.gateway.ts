import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  BookDepthEvent,
  MarketDataEvent,
  OrderCancelledEvent,
  OrderFilledEvent,
  OrderPartialEvent,
  OrderPlacedEvent,
  OrderRejectedEvent,
  TradeEvent,
} from 'src/redis/redis-subscriber.event-types';

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV !== 'production' ? '' : ['http://localhost:5173'],
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WsGateway.name);
  private server: Server | null = null;
  private clientsByAccount = new Map<number, Socket>();
  private subscribersByOutcome = new Map<string, Set<Socket>>();
  private subscribersByMarket = new Map<number, Set<Socket>>();

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const set of this.subscribersByOutcome.values()) {
      set.delete(client);
    }
    for (const set of this.subscribersByMarket.values()) {
      set.delete(client);
    }
    for (const [accountId, sock] of this.clientsByAccount.entries()) {
      if (sock.id === client.id) {
        this.clientsByAccount.delete(accountId);
      }
    }
  }

  @SubscribeMessage('registerAccount')
  handleRegisterAccount(client: Socket, payload: { accountId: number }) {
    this.clientsByAccount.set(payload.accountId, client);
    this.logger.debug(
      `Account ${payload.accountId} bound to socket ${client.id}`,
    );
  }

  @SubscribeMessage('unregisterAccount')
  handleUnRegisterAccount(client: Socket, payload: { accountId: number }) {
    this.clientsByAccount.delete(payload.accountId);
    this.logger.debug(
      `Account ${payload.accountId} unbounded to socket ${client.id}`,
    );
  }

  @SubscribeMessage('subscribeOutcome')
  handleSubscribeOutcome(client: Socket, payload: { outcomeId: string }) {
    let set = this.subscribersByOutcome.get(payload.outcomeId);
    if (!set) {
      set = new Set();
      this.subscribersByOutcome.set(payload.outcomeId, set);
    }
    set.add(client);
    this.logger.debug(
      `Socket ${client.id} subscribed to outcome=${payload.outcomeId}`,
    );
  }

  @SubscribeMessage('subscribeMarket')
  handleSubscribeMarket(client: Socket, payload: { marketId: number }) {
    let set = this.subscribersByMarket.get(payload.marketId);
    if (!set) {
      set = new Set();
      this.subscribersByMarket.set(payload.marketId, set);
    }
    set.add(client);
    this.logger.debug(
      `Socket ${client.id} subscribed to market=${payload.marketId}`,
    );
    return { success: true, marketId: payload.marketId };
  }

  @SubscribeMessage('unsubscribeOutcome')
  handleUnSubscribeOutcome(client: Socket, payload: { outcomeId: string }) {
    const set = this.subscribersByOutcome.get(payload.outcomeId);
    if (!set) {
      this.logger.debug(
        `Socket ${client.id} unsubscribed to outcome=${payload.outcomeId}`,
      );
      return;
    }
    set.delete(client);
    this.logger.debug(
      `Socket ${client.id} unsubscribed to outcome=${payload.outcomeId}`,
    );
    return;
  }

  @SubscribeMessage('unsubscribeMarket')
  handleUnSubscribeMarket(client: Socket, payload: { marketId: number }) {
    const set = this.subscribersByMarket.get(payload.marketId);
    if (!set) {
      this.logger.debug(
        `Socket ${client.id} unsubscribed to market=${payload.marketId}`,
      );
      return;
    }
    set.delete(client);
    this.logger.debug(
      `Socket ${client.id} unsubscribed to market=${payload.marketId}`,
    );
    return;
  }

  broadcastDepth(outcomeId: string, payload: BookDepthEvent) {
    const listeners = this.subscribersByOutcome.get(outcomeId);
    if (!listeners) return;
    for (const client of listeners) client.emit('book.depth', payload);
  }

  broadcastMarketData(marketId: number, payload: MarketDataEvent) {
    const listeners = this.subscribersByMarket.get(marketId);
    if (!listeners) return;
    for (const client of listeners) client.emit('market.data', payload);
  }

  // PRIVATE broadcast on orders
  broadcastOrderPartial(accountId: number, payload: OrderPartialEvent) {
    const client = this.clientsByAccount.get(accountId);
    client?.emit('order.partial', payload);
  }

  broadcastTrade(
    accountId: number,
    filledAccountId: number,
    payload: TradeEvent,
  ) {
    const client = this.clientsByAccount.get(accountId);
    const filledClient = this.clientsByAccount.get(filledAccountId);
    client?.emit('trade', payload);
    filledClient?.emit('trade', payload);
  }

  broadcastFill(accountId: number, payload: OrderFilledEvent) {
    this.clientsByAccount.get(accountId)?.emit('order.filled', payload);
  }

  broadcastCancel(accountId: number, payload: OrderCancelledEvent) {
    this.clientsByAccount.get(accountId)?.emit('order.cancelled', payload);
  }

  broadcastOrderRejected(accountId: number, payload: OrderRejectedEvent) {
    this.clientsByAccount.get(accountId)?.emit('order.rejected', payload);
  }

  broadcastOrderPlaced(accountId: number, payload: OrderPlacedEvent) {
    this.clientsByAccount.get(accountId)?.emit('order.placed', payload);
  }
}
