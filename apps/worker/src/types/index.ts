export type OrderPartialEvent = {
  type: "order.partial";
  orderId: string;
  remaining: number;
  timestamp: string;
};

export type OrderFilledEvent = {
  type: "order.filled";
  fillId: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  price: number;
  quantity: number;
  timestamp: string;
};

export type OrderCancelledEvent = {
  type: "order.cancelled";
  orderId: string;
  outcomeId: string;
  timestamp: string;
};

export type EngineEvent =
  | OrderPartialEvent
  | OrderFilledEvent
  | OrderCancelledEvent;
