import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TradeModalProps {
  outcome: {
    id: string;
    name: string;
    probability: number;
    lastPrice: number;
  };
  side: "buy" | "sell";
  onClose: () => void;
}

export function TradeModal({ outcome, side, onClose }: TradeModalProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState(outcome.lastPrice.toFixed(2));
  const navigate = useNavigate();

  const estimatedCost =
    orderType === "market"
      ? parseFloat(quantity || "0") * outcome.lastPrice
      : parseFloat(quantity || "0") * parseFloat(limitPrice || "0");

  const handleSubmit = () => {
    if (!false) {
      toast.error("Please log in to trade");
      navigate("/auth/login");
      return;
    }

    if (false) {
      toast.error("Please create a trading account first");
      navigate("/trading-account");
      return;
    }

    toast.success(
      `Order placed: ${side.toUpperCase()} ${quantity} contracts of "${outcome.name}" at ${orderType === "market" ? "market price" : `$${limitPrice}`}`,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            <span
              className={side === "buy" ? "text-success" : "text-destructive"}
            >
              {side === "buy" ? "Buy" : "Sell"}
            </span>{" "}
            {outcome.name}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Current Price</p>
          <p className="text-2xl font-mono font-bold text-primary">
            ${outcome.lastPrice.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            {outcome.probability}% probability
          </p>
        </div>

        <Tabs
          value={orderType}
          onValueChange={(v) => setOrderType(v as "market" | "limit")}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Quantity (contracts)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Executes immediately at best available price
            </p>
          </TabsContent>

          <TabsContent value="limit" className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Quantity (contracts)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Limit Price
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Order executes when price reaches your limit
            </p>
          </TabsContent>
        </Tabs>

        <div className="glass-card bg-muted/50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Estimated Cost
            </span>
            <span className="text-lg font-mono font-bold text-accent">
              ${estimatedCost.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!quantity || parseFloat(quantity) <= 0}
          className={`w-full ${
            side === "buy"
              ? "bg-success hover:bg-success/90"
              : "bg-destructive hover:bg-destructive/90"
          }`}
        >
          {side === "buy" ? "Place Buy Order" : "Place Sell Order"}
        </Button>
      </div>
    </div>
  );
}
