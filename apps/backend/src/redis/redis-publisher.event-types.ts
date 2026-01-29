import { OrderSide, OrderType } from 'generated/prisma/enums';

export type OrderNewEvent = {
  type: 'order.new';
  outcome_id: string;
  market_id: number;
  outcome_name: string;
  account_id: number;
  side: OrderSide;
  order_type: OrderType;
  price: number;
  qty_remaining: number;
  qty_original: number;
};

export type OrderCancelledEvent = {
  type: 'order.cancelled';
  order_id: number;
  account_id: number;
  outcome_id: string;
  timestamp: string;
};

export type EngineEvent = OrderNewEvent | OrderCancelledEvent;
