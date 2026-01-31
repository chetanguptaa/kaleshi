import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCanSellOrderSchema, TCreateOrderSchema } from './order.controller';
import { RedisPublisherService } from 'src/redis/redis.publisher.service';
import { OrderNewEvent } from 'src/redis/redis-publisher.event-types';
import { TimeInForce } from 'generated/prisma/enums';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisPublisherService: RedisPublisherService,
  ) {}

  async canSell(accountId: number, body: TCanSellOrderSchema) {
    const ownedShares = await this.calculateOwnedShares(
      +accountId,
      body.outcomeId,
    );
    if (ownedShares === 0) {
      return {
        success: true,
        canSell: false,
      };
    }
    const lockedInOrders = await this.prismaService.order.aggregate({
      where: {
        accountId,
        outcomeId: body.outcomeId,
        side: 'Sell',
        status: 'OPEN',
      },
      _sum: {
        quantity: true,
      },
    });
    const lockedShares = lockedInOrders._sum.quantity || 0;
    const availableShares = ownedShares - lockedShares;
    if (availableShares === 0) {
      return {
        success: true,
        canSell: false,
      };
    }
    if (body.requestedQuantity > availableShares) {
      return {
        success: true,
        canSell: false,
      };
    }
    return {
      success: true,
      canSell: true,
    };
  }

  private async calculateOwnedShares(
    accountId: number,
    outcomeId: string,
  ): Promise<number> {
    const fills = await this.prismaService.fill.findMany({
      where: {
        order: {
          outcomeId,
        },
        OR: [{ accountId }, { filledAccountId: accountId }],
      },
      select: {
        quantity: true,
        accountId: true,
        filledAccountId: true,
      },
    });
    let netShares = 0;
    for (const fill of fills) {
      if (fill.accountId === accountId) {
        netShares += fill.quantity;
      }
      if (fill.filledAccountId === accountId) {
        netShares -= fill.quantity;
      }
    }
    return Math.max(0, netShares);
  }

  async placeOrder(accountId: number, body: TCreateOrderSchema) {
    const account = await this.prismaService.account.findUnique({
      where: {
        id: accountId,
      },
    });
    if (!account) {
      throw new BadRequestException('Account does not exist');
    }
    if (body.side === 'Sell') {
      const canSell = await this.canSell(accountId, {
        outcomeId: body.outcomeId,
        requestedQuantity: body.quantity,
      });
      if (!canSell.success || !canSell.canSell) {
        throw new BadRequestException('Insufficient shares to sell');
      }
    }
    const scaledPrice = body.price ? Math.round(body.price * 100) : 0;
    const quantity = body.quantity;
    if (body.orderType === 'LIMIT' && account.coins < scaledPrice * quantity) {
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
      orderCost = scaledPrice * quantity;
    } else if (body.orderType === 'MARKET') {
      const fairPrice = await this.getFairPrice(body.outcomeId);
      if (!fairPrice) {
        throw new BadRequestException(
          'Fair price not available for this outcome',
        );
      }
      orderCost = fairPrice * quantity;
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
      qty_remaining: quantity,
      qty_original: quantity,
      time_in_force: body.timeInForce ?? TimeInForce.IOC, // default IOC for market orders
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

  private async getFairPrice(outcomeId: string) {
    const fair_price = await this.redisPublisherService.getOrderBook(outcomeId);
    if (!fair_price) return null;
    return fair_price;
  }
}
