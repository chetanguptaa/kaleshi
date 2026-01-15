import { OrderSide } from 'generated/prisma/enums';

export type OrderNewEvent = {
  type: 'order.new';
  orderId: string;
  marketId: number;
  outcomeId: string;
  side: OrderSide;
  price: number;
  quantity: number;
  accountId: string;
  timestamp: string;
};

export type OrderPartialEvent = {
  type: 'order.partial';
  orderId: string;
  remaining: number;
  marketId: number;
  outcomeId: string;
};

export type FillCreatedEvent = {
  type: 'fill.created';
  fillId: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  marketId: number;
  outcomeId: string;
  price: number;
  quantity: number;
  timestamp: string;
};

export type EngineEvent = OrderPartialEvent | FillCreatedEvent;
