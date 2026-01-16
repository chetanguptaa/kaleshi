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
    for (const [accountId, sock] of this.clientsByAccount.entries()) {
      if (sock.id === client.id) {
        this.clientsByAccount.delete(accountId);
      }
    }
  }

  @SubscribeMessage('registerAccount')
  handleRegisterAccount(client: Socket, payload: { accountId: string }) {
    this.clientsByAccount.set(payload.accountId, client);
    this.logger.debug(
      `Account ${payload.accountId} bound to socket ${client.id}`,
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

  broadcastDepth(outcomeId: string, payload: any) {
    const listeners = this.subscribersByOutcome.get(outcomeId);
    if (!listeners) return;
    for (const client of listeners) client.emit('depth', payload);
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
