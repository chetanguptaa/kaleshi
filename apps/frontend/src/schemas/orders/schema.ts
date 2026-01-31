import { z } from "zod";
import { ETimeInForce } from "../market/schema";

export enum EOrderType {
  MARKET = "MARKET",
  LIMIT = "LIMIT",
}

export enum EOrderSide {
  BUY = "Buy",
  SELL = "Sell",
}

export const createOrderRequestSchema = z
  .object({
    outcomeId: z.uuid(),
    quantity: z.number(),
    price: z.number().optional(),
    side: z.enum([EOrderSide.BUY, EOrderSide.SELL]),
    orderType: z.enum([EOrderType.MARKET, EOrderType.LIMIT]),
    timeInForce: z
      .enum([ETimeInForce.GTC, ETimeInForce.IOC, ETimeInForce.FOK])
      .optional(),
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
  .refine(
    (data) => {
      if (data.orderType === EOrderType.MARKET && data.timeInForce) {
        return false;
      }
      return true;
    },
    {
      message: "TimerIcon is required for LIMIT and must be omitted for MARKET",
      path: ["timeInForce"],
    },
  )
  .loose();

export const canSellOrderRequestSchema = z
  .object({
    outcomeId: z.uuid(),
    requestedQuantity: z.number().default(1),
  })
  .loose();

export const canSellOrderResponseSchema = z.object({
  success: z.boolean(),
  canSell: z.boolean(),
});

export const createOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable().optional(),
});

export type TCreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type TCreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type TCanSellOrderRequest = z.infer<typeof canSellOrderRequestSchema>;
export type TCanSellOrderResponse = z.infer<typeof canSellOrderResponseSchema>;
