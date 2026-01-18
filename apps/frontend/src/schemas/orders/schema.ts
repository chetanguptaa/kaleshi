import { z } from "zod";

export enum EOrderType {
  MARKET = "MARKET",
  LIMIT = "LIMIT",
}

export enum EOrderSide {
  BUY = "BUY",
  SELL = "SELL",
}

export const createOrderRequestSchema = z
  .object({
    outcomeId: z.uuid(),
    quantity: z.number(),
    price: z.number().optional(),
    side: z.enum([EOrderSide.BUY, EOrderSide.SELL]),
    orderType: z.enum([EOrderType.MARKET, EOrderType.LIMIT]),
  })
  .refine(
    (data) => {
      if (data.orderType === EOrderType.MARKET && data.price !== undefined) {
        return false;
      }
      if (data.orderType === EOrderType.LIMIT && data.price === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Price is required for LIMIT and must be omitted for MARKET",
      path: ["price"],
    },
  )
  .loose();

export const createOrderResponseSchema = z.object({
  success: z.boolean(),
  id: z.uuid(),
});

export type TCreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type TCreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
