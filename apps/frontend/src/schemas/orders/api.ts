import { mutate } from "@/api/mutate";
import {
  canSellOrderRequestSchema,
  canSellOrderResponseSchema,
  createOrderRequestSchema,
  createOrderResponseSchema,
  TCanSellOrderRequest,
  TCreateOrderRequest,
} from "./schema";

export const createOrder = (data: TCreateOrderRequest) =>
  mutate({
    config: {
      url: "/order",
      method: "POST",
      withCredentials: true,
    },
    requestSchema: createOrderRequestSchema,
    responseSchema: createOrderResponseSchema,
    data,
  });

export const canSellOrder = (data: TCanSellOrderRequest) =>
  mutate({
    config: {
      url: "/order/can-sell",
      method: "POST",
      withCredentials: true,
    },
    requestSchema: canSellOrderRequestSchema,
    responseSchema: canSellOrderResponseSchema,
    data,
  });
