import { TBookDepthByOutcomeIdResponse } from "@/schemas/market/schema";

export function OrderBook(bookDepth: TBookDepthByOutcomeIdResponse) {
  const maxTotal = Math.max(
    ...bookDepth?.bids?.map((b) => b[0] * b[1]),
    ...bookDepth?.asks?.map((a) => a[0] * a[1]),
  );
  return (
    <div className="glass-card p-5 animate-slide-up">
      <h3 className="font-semibold mb-4">Order Book</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-2">
            <span>Price</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {bookDepth?.bids?.map((bid, i) => (
              <div key={i} className="order-book-row relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-success/10"
                  style={{ width: `${((bid[0] * bid[1]) / maxTotal) * 100}%` }}
                />
                <span className="relative font-mono text-success">
                  ${(bid[0] / 100)?.toFixed(2)}
                </span>
                <span className="relative font-mono text-muted-foreground">
                  {(bid[1] / 100)?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-2">
            <span>Price</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {bookDepth?.asks?.map((ask, i) => (
              <div key={i} className="order-book-row relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-destructive/10 right-0"
                  style={{ width: `${((ask[0] * ask[1]) / maxTotal) * 100}%` }}
                />
                <span className="relative font-mono text-destructive">
                  ${(ask[0] / 100)?.toFixed(2)}
                </span>
                <span className="relative font-mono text-muted-foreground">
                  {(ask[1] / 100)?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
