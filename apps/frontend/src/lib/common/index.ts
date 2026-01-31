export type OrderPlacedSocketEvent = {
  type: "order.placed";
  order_id: number;
  account_id: number;
  outcome_id: string;
  quantity: number;
  price: number;
};

export type OrderFilledSocketEvent = {
  type: "order.filled";
  order_id: number;
  account_id: number;
  outcome_id: string;
  quantity: number;
  price: number;
};

export type OrderCancelledSocketEvent = {
  type: "order.cancelled";
  quantity: number;
  price: number;
  order_id: number;
  account_id: number;
  outcome_id: string;
  timestamp: string;
};

export type OrderRejectedSocketEvent = {
  type: "order.rejected";
  account_id: number;
  outcome_id: string;
  quantity: number;
  price: number;
};

export type TradeSocketEvent = {
  type: "trade";
  trade_id: string;
  account_id: number;
  outcome_id: string;
  order_id: number;
  filled_order_id: number;
  filled_account_id: number;
  price: number;
  quantity: number;
  remaining: number;
  order_quantity: number;
};

export type OrderPartialSocketEvent = {
  type: "order.partial";
  order_id: number;
  account_id: number;
  outcome_id: string;
  quantity: number;
  price: number;
  remaining: number;
  original_quantity: number;
};
