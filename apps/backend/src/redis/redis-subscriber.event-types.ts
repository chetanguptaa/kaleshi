import { OrderSide, TimeInForce } from 'generated/prisma/enums';

export type OrderPlacedEvent = {
  type: 'order.placed';
  order_id: number;
  account_id: number;
  outcome_id: string;
  side: OrderSide;
  quantity: number;
  price: number;
  time_in_force: TimeInForce | null;
};

export type OrderPartialEvent = {
  type: 'order.partial';
  order_id: number;
  account_id: number;
  outcome_id: string;
  side: OrderSide;
  quantity: number;
  price: number;
  remaining: number;
  original_quantity: number;
  time_in_force: TimeInForce | null;
};

export type OrderFilledEvent = {
  type: 'order.filled';
  order_id: number;
  account_id: number;
  outcome_id: string;
  side: OrderSide;
  quantity: number;
  price: number;
  time_in_force: TimeInForce | null;
};

export type OrderCancelledEvent = {
  type: 'order.cancelled';
  side: OrderSide;
  quantity: number;
  price: number;
  time_in_force: TimeInForce | null;
  order_id: number;
  account_id: number;
  outcome_id: string;
  timestamp: string;
};

export type OrderRejectedEvent = {
  type: 'order.rejected';
  account_id: number;
  outcome_id: string;
  side: OrderSide;
  quantity: number;
  price: number;
  time_in_force: TimeInForce | null;
};

export type BookDepthEvent = {
  type: 'book.depth';
  market_id: number;
  outcome_id: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
};

export type MarketDataEvent = {
  type: 'market.data';
  marketId: number;
  data: {
    outcomeId: string;
    fairPrice: number;
    totalVolume: number;
  }[];
  timestamp: number;
};

export type TradeEvent = {
  type: 'trade';
  trade_id: string;
  account_id: number;
  outcome_id: string;
  order_id: number;
  filled_order_id: number;
  filled_account_id: number;
  price: number;
  quantity: number;
  side: OrderSide;
  remaining: number;
  order_quantity: number;
  time_in_force: TimeInForce | null;
};

export type EngineEvent =
  | OrderPlacedEvent
  | OrderPartialEvent
  | OrderFilledEvent
  | OrderCancelledEvent
  | OrderRejectedEvent
  | TradeEvent
  | BookDepthEvent
  | MarketDataEvent;
