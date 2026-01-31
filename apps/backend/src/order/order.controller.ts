import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { z } from 'zod';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { type AppRequest } from 'src/@types/express';
import { AccountGuard } from 'src/auth/account.guard';
import { OrderSide, OrderType, TimeInForce } from 'generated/prisma/enums';

const createOrderSchema = z
  .object({
    outcomeId: z.uuid(),
    quantity: z.number().positive('Quantity must be greater than 0'),
    price: z
      .number()
      .gt(0, 'Price must be greater than 0')
      .lte(1, 'Price must be less than or equal to 1')
      .refine((p) => Number.isInteger(p * 100), {
        message: 'Price must have at most 2 decimal places',
      })
      .optional(),
    side: z.enum([OrderSide.Buy, OrderSide.Sell]),
    orderType: z.enum([OrderType.LIMIT, OrderType.MARKET]),
    timeInForce: z
      .enum([TimeInForce.GTC, TimeInForce.IOC, TimeInForce.FOK])
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.orderType === OrderType.MARKET && data.price !== undefined)
        return false;
      if (data.orderType === OrderType.LIMIT && data.price === undefined)
        return false;
      return true;
    },
    {
      message: 'Price is required for LIMIT and must be omitted for MARKET',
      path: ['price'],
    },
  )
  .refine(
    (data) => {
      if (data.orderType === OrderType.MARKET && data.timeInForce) {
        return false;
      }
      return true;
    },
    {
      message: "Market order doesn't support time in force",
      path: ['timeInForce'],
    },
  );

export type TCreateOrderSchema = z.infer<typeof createOrderSchema>;

export const canSellOrderSchema = z.object({
  outcomeId: z.uuid(),
  requestedQuantity: z.number().min(0).max(100000).default(1),
});

export type TCanSellOrderSchema = z.infer<typeof canSellOrderSchema>;

@Controller('order')
@UseGuards(AuthGuard, RolesGuard, AccountGuard)
@Roles(ROLES.COMMON)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('')
  async placeOrder(@Req() req: AppRequest, @Body() raw: any) {
    const accountId = req.user.accountId!;
    const parsed = await createOrderSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.orderService.placeOrder(+accountId, parsed.data);
  }

  @Post(':orderId/cancel')
  async cancel(@Req() req: AppRequest, @Param('orderId') orderId: number) {
    const accountId = req.user.accountId!;
    return await this.orderService.cancelOrder(+accountId, +orderId);
  }

  @Post('can-sell')
  async canSell(@Req() req: AppRequest, @Body() raw: any) {
    const accountId = req.user.accountId!;
    const parsed = await canSellOrderSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.orderService.canSell(+accountId, parsed.data);
  }
}
