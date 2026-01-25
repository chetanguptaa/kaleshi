import { OrderSide, OrderType } from 'generated/prisma/enums';

export type OrderNewEvent = {
  type: 'order.new';
  outcome_id: string;
  market_id: number;
  account_id: string;
  side: OrderSide;
  order_type: OrderType;
  price: number | null;
  quantity: number;
};

export type OrderCancelEvent = {
  type: 'order.cancel';
  order_id: string;
  outcome_id: string;
  market_id: number;
  account_id: string;
};

export type BackendPublishedEvent = OrderNewEvent | OrderCancelEvent;
