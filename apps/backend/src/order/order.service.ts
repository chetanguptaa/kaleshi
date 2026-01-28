import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async placeOrder(accountId: number, body: TCreateOrderSchema) {
    const account = await this.prismaService.account.findUnique({
      where: {
        id: accountId,
      },
    });
    if (!account) {
      throw new BadRequestException('Account does not exist');
    }
    const scaledPrice = body.price ? Math.round(body.price * 100) : 0;
    const scaledQuantity = Math.round(body.quantity * 100);
    if (
      body.orderType === 'LIMIT' &&
      account.coins < scaledQuantity * scaledPrice
    ) {
      throw new BadRequestException('Not enough balance available');
    }
    const outcome = await this.prismaService.outcome.findUnique({
      where: {
        id: body.outcomeId,
      },
    });
    if (!outcome) {
      throw new NotFoundException('Outcome does not exist');
    }
    let orderCost = 0;
    if (body.orderType === 'LIMIT') {
      orderCost = Math.round((scaledPrice * scaledQuantity) / 100);
    } else if (body.orderType === 'MARKET') {
      const fairPrice = await this.getOrderBook(body.outcomeId);
      if (!fairPrice) {
        throw new BadRequestException(
          'Fair price not available for this outcome',
        );
      }
      orderCost = Math.round((fairPrice * scaledQuantity) / 100);
    }
    const available = account.coins - account.reservedCoins;
    if (orderCost > available) {
      throw new BadRequestException('Not enough available balance');
    }
    await this.prismaService.account.update({
      where: { id: accountId },
      data: {
        reservedCoins: { increment: orderCost },
      },
    });
    const eventData: OrderNewEvent = {
      type: 'order.new',
      outcome_id: body.outcomeId,
      outcome_name: outcome.name,
      market_id: outcome.marketId,
      account_id: accountId,
      side: body.side,
      order_type: body.orderType,
      price: scaledPrice ?? 0,
      qty_remaining: scaledQuantity,
      qty_original: scaledQuantity,
    };
    await this.redisPublisherService.pushOrderCommand(eventData);
    return {
      success: true,
      message: 'Order created successfully',
    };
  }

  async cancelOrder(accountId: number, orderId: number) {
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

  private async getOrderBook(outcomeId: string) {
    const fair_price = await this.redisPublisherService.getOrderBook(outcomeId);
    if (!fair_price) return null;
    return fair_price;
  }
}
