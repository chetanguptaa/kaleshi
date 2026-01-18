import { OrderSide, OrderType } from 'generated/prisma/enums';

export type OrderNewEvent = {
  type: 'order.new';
  order_id: string;
  outcome_id: string;
  ticker: string;
  market_id: number;
  outcome_name: string;
  account_id: string;
  side: OrderSide;
  order_type: OrderType;
  price: number | null;
  qty_remaining: number;
  qty_original: number;
};

export type OrderPartialEvent = {
  type: 'order.partial';
  order_id: string;
  account_id: string;
  remaining: number;
  original_quantity: number;
  outcome_id: string;
  timestamp: number;
};

export type OrderFilledEvent = {
  type: 'order.filled';
  fill_id: string;
  buy_order_id: string;
  sell_order_id: string;
  buyer_account_id: string;
  seller_account_id: string;
  market_id: number;
  outcome_id: string;
  price: number;
  quantity: number;
  timestamp: number;
};

export type OrderCancelledEvent = {
  type: 'order.cancelled';
  order_id: string;
  account_id: string;
  outcome_id: string;
  timestamp: string;
};

export type BookDepthEvent = {
  type: 'book.depth';
  outcome_id: string;
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  timestamp: number;
};

export type MarketDataEvent = {
  type: 'market.data';
  market_id: number;
  timestamp: number;
  outcomes: {
    outcome_id: string;
    outcome_name: string;
    total_volume: number;
    total_notional: number;
    price: number;
    ticker: string;
  };
};

export type EngineEvent =
  | OrderPartialEvent
  | OrderFilledEvent
  | OrderCancelledEvent
  | BookDepthEvent
  | MarketDataEvent;
