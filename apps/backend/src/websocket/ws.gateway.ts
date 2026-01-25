import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV !== 'production' ? '' : ['http://localhost:5173'],
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WsGateway.name);
  private server: Server | null = null;
  private clientsByAccount = new Map<string, Socket>();
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
  handleRegisterAccount(client: Socket, payload: { accountId: string }) {
    this.clientsByAccount.set(payload.accountId, client);
    return { success: true, accountId: payload.accountId };
    this.logger.debug(
      `Account ${payload.accountId} bound to socket ${client.id}`,
    );
  }

  @SubscribeMessage('unregisterAccount')
  handleUnRegisterAccount(client: Socket, payload: { accountId: string }) {
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

  broadcastDepth(outcomeId: string, payload: any) {
    const listeners = this.subscribersByOutcome.get(outcomeId);
    console.log('listeners ', JSON.stringify(listeners, null, 2));
    if (!listeners) return;
    for (const client of listeners) client.emit('book.depth', payload);
  }

  broadcastMarketData(marketId: number, payload: any) {
    const listeners = this.subscribersByMarket.get(marketId);
    if (!listeners) return;
    for (const client of listeners) client.emit('market.data', payload);
  }

  // PRIVATE broadcast on orders
  broadcastOrderPartial(accountId: string, payload: any) {
    const client = this.clientsByAccount.get(accountId);
    client?.emit('order.partial', payload);
  }

  broadcastFill(buyerId: string, sellerId: string, payload: any) {
    this.clientsByAccount.get(buyerId)?.emit('order.filled', payload);
    this.clientsByAccount.get(sellerId)?.emit('order.filled', payload);
  }

  broadcastCancel(accountId: string, payload: any) {
    this.clientsByAccount.get(accountId)?.emit('order.cancelled', payload);
  }
}
