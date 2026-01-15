import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';

type SubscribeMessageType = {
  outcome_id: string;
};

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV !== 'production' ? '' : ['http://localhost:5173'],
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WsGateway.name);
  private server: Server | null = null;

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: SubscribeMessageType,
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.outcome_id;
    await client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { subscribed: room };
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: SubscribeMessageType,
    @ConnectedSocket() client: Socket,
  ) {
    const room = data.outcome_id;
    await client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { unsubscribed: room };
  }

  broadcastToMarket(outcome_id: string, event: string, payload: any) {
    const room = outcome_id;
    if (this.server) {
      this.server.to(room).emit(event, payload);
    }
  }
}
