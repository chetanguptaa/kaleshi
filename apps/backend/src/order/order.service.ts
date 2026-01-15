import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateOrderSchema } from './order.controller';
import { RedisPublisherService } from 'src/redis/redis.publisher.service';

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
        marketId: body.marketId,
        outcomeId: body.outcomeId,
        side: body.side,
        quantity: body.quantity,
        originalQuantity: body.quantity,
        price: body.price,
        orderType: body.orderType,
        status: 'OPEN',
      },
    });
    await this.redisPublisherService.publishOrderCommand({
      type: 'order.new',
      orderId: order.id,
      timestamp: new Date().toISOString(),
    });
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
    await this.redisPublisherService.publishOrderCommand({
      type: 'order.cancel',
      orderId,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }
}
