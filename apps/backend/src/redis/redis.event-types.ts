import { OrderSide, OrderType } from 'generated/prisma/enums';

export type OrderNewEvent = {
  type: 'order.new';
  order_id: string;
  market_id: number;
  outcome_id: string;
  account_id: string;
  side: OrderSide;
  order_type: OrderType;
  price: number | null;
  qty_remaining: number;
  qty_original: number;
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
