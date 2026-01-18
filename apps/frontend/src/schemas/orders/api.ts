import { mutate } from "@/api/mutate";
import {
  createOrderRequestSchema,
  createOrderResponseSchema,
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
