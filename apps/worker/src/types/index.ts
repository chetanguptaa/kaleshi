export type OrderPartialEvent = {
  type: "order.partial";
  order_id: string;
  account_id: string;
  remaining: number;
  outcome_id: string;
  timestamp: number;
};

export type OrderFilledEvent = {
  type: "order.filled";
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
  type: "order.cancelled";
  order_id: string;
  account_id: string;
  outcome_id: string;
  timestamp: string;
};

export type BookDepthEvent = {
  type: "book.depth";
  market_id: number;
  outcome_id: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
};

export type EngineEvent =
  | OrderPartialEvent
  | OrderFilledEvent
  | OrderCancelledEvent
  | BookDepthEvent;

export type TStreamMessage = {
  id: string;
  message: Record<string, string>;
};

export type TStreamResponse = {
  name: string;
  messages: TStreamMessage[];
}[];
