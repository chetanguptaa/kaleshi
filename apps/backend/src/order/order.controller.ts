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
import { OrderSide, OrderType } from 'generated/prisma/enums';

const createOrderSchema = z
  .object({
    outcomeId: z.uuid(),
    quantity: z.number(),
    price: z.number().optional(),
    side: z.enum([OrderSide.BUY, OrderSide.SELL]),
    orderType: z.enum([OrderType.LIMIT, OrderType.MARKET]),
  })
  .strict()
  .refine(
    (data) => {
      // Pointer: MARKET orders should NOT include price
      if (data.orderType === OrderType.MARKET && data.price !== undefined)
        return false;
      // Pointer: LIMIT orders MUST include price
      if (data.orderType === OrderType.LIMIT && data.price === undefined)
        return false;
      return true;
    },
    {
      message: 'Price is required for LIMIT and must be omitted for MARKET',
      path: ['price'],
    },
  );

export type TCreateOrderSchema = z.infer<typeof createOrderSchema>;

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
    return await this.orderService.placeOrder(accountId, parsed.data);
  }

  @Post(':orderId/cancel')
  async cancel(@Req() req: AppRequest, @Param('orderId') orderId: string) {
    const accountId = req.user.accountId!;
    return await this.orderService.cancelOrder(accountId, orderId);
  }
}
