import { OrderBook as OrderBookType } from '@/lib/mockData';

interface OrderBookProps {
  orderBook: OrderBookType;
}

export function OrderBook({ orderBook }: OrderBookProps) {
  const maxTotal = Math.max(
    ...orderBook.bids.map(b => b.total),
    ...orderBook.asks.map(a => a.total)
  );
  
  return (
    <div className="glass-card p-5 animate-slide-up">
      <h3 className="font-semibold mb-4">Order Book</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Bids (Buy orders) */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-2">
            <span>Price</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {orderBook.bids.map((bid, i) => (
              <div key={i} className="order-book-row relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-success/10"
                  style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                />
                <span className="relative font-mono text-success">
                  ${bid.price.toFixed(2)}
                </span>
                <span className="relative font-mono text-muted-foreground">
                  {bid.quantity.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Asks (Sell orders) */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-2">
            <span>Price</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {orderBook.asks.map((ask, i) => (
              <div key={i} className="order-book-row relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-destructive/10 right-0"
                  style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                />
                <span className="relative font-mono text-destructive">
                  ${ask.price.toFixed(2)}
                </span>
                <span className="relative font-mono text-muted-foreground">
                  {ask.quantity.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
