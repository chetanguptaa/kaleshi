import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateOrderSchema } from './order.controller';
import { RedisPublisherService } from 'src/redis/redis.publisher.service';
import { OrderNewEvent } from 'src/redis/redis.event-types';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisPublisherService: RedisPublisherService,
  ) {}

  async placeOrder(accountId: string, body: TCreateOrderSchema) {
    const account = await this.prismaService.account.findUnique({
      where: {
        id: accountId,
      },
    });
    if (!account) {
      throw new BadRequestException('Account does not exist');
    }
    if (
      body.orderType === 'LIMIT' &&
      body.price &&
      account.coins < body.price
    ) {
      throw new BadRequestException('Not enough balance available');
    }
    const order = await this.prismaService.order.create({
      data: {
        accountId: body.accountId,
        outcomeId: body.outcomeId,
        side: body.side,
        quantity: body.quantity,
        originalQuantity: body.quantity,
        price: body.price,
        orderType: body.orderType,
        status: 'OPEN',
      },
    });
    const eventData: OrderNewEvent = {
      type: 'order.new',
      order_id: order.id,
      outcome_id: order.outcomeId,
      account_id: accountId,
      side: order.side,
      order_type: order.orderType,
      price: order.price,
      qty_remaining: order.quantity,
      qty_original: order.originalQuantity,
    };
    await this.redisPublisherService.pushOrderCommand(eventData);
    return {
      success: true,
      id: order.id,
    };
  }

  async cancelOrder(accountId: string, orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.accountId !== accountId) {
      throw new BadRequestException('Order not found or unauthorized');
    }
    if (order.status !== 'OPEN' && order.status !== 'PARTIAL') {
      throw new BadRequestException('Cannot cancel closed order');
    }
    await this.prismaService.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
    await this.redisPublisherService.pushOrderCommand({
      type: 'order.cancelled',
      order_id: orderId,
      account_id: accountId,
      outcome_id: order.outcomeId,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }
}
