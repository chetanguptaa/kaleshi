import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { useMarketById, useMarketSocket } from "@/schemas/dashboard/hooks";
import { TOutcomeSchema } from "@/schemas/dashboard/schema";
import { TCurrentUser } from "@/schemas/layout/schema";
import { useCreateOrder } from "@/schemas/orders/hooks";
import { EOrderSide, EOrderType } from "@/schemas/orders/schema";
import { CoinsIcon, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MAX_OUTCOMES_VISIBLE } from "../constants";
import { getMostUpvotedComment, IOutcome, timeAgo } from "../utils";

const TrendingMarketCard = ({
  id,
  currentUser,
}: {
  id: number;
  currentUser: TCurrentUser | null;
}) => {
  const trendingMarket = useMarketById(id);
  const marketSocket = useMarketSocket(id, currentUser.accountId);
  const { mutate, isPending } = useCreateOrder();
  const [selectedOutcome, setSelectedOutcome] = useState<TOutcomeSchema | null>(
    null,
  );
  const [outcomesWS, setOutcomesWS] = useState<IOutcome[]>([]);
  const [outcomes, setOutcomes] = useState<
    (TOutcomeSchema & {
      price: number;
    })[]
  >([]);
  const [orderType, setOrderType] = useState<EOrderType>(EOrderType.LIMIT);
  const [orderSide, setOrderSide] = useState<EOrderSide>(EOrderSide.BUY);
  const [quantity, setQuantity] = useState<number>(0.1);
  const [limitPrice, setLimitPrice] = useState<number>(0.1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isLoggedIn = Boolean(currentUser);
  const hasTradingAccount = Boolean(currentUser?.accountId);
  const { totalVolume, totalNotional } = useMemo(() => {
    if (!outcomesWS.length) return { totalVolume: 0, totalNotional: 0 };
    return outcomesWS.reduce(
      (acc, o) => {
        acc.totalVolume += o.total_volume;
        acc.totalNotional += o.total_notional;
        return acc;
      },
      { totalVolume: 0, totalNotional: 0 },
    );
  }, [outcomesWS]);
  useSocketEvent<{
    market_id: number;
    outcomes: IOutcome[];
    timestamp: number;
  }>("market.data", (payload) => {
    if (payload.market_id !== id) return;
    setOutcomesWS(payload?.outcomes);
  });

  let mostUpvotedComment = getMostUpvotedComment(
    trendingMarket?.data?.market?.comments || [],
  );

  const marketOutcomes = useMemo(
    () => trendingMarket?.data?.market?.outcomes ?? [],
    [trendingMarket?.data?.market?.outcomes],
  );

  const hasMoreOutcomes = outcomes.length > MAX_OUTCOMES_VISIBLE;

  useEffect(() => {
    if (!marketOutcomes.length) return;
    const wsPriceMap = new Map(
      outcomesWS.map((ws) => [
        ws.outcome_id,
        ws.prices[ws.prices.length - 1] / 100,
      ]),
    );
    setOutcomes(
      marketOutcomes.map((o) => ({
        ...o,
        price: wsPriceMap.get(o.id) ?? 0.1,
      })),
    );
  }, [marketOutcomes, outcomesWS]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) return;
    mutate(
      {
        side: orderSide,
        orderType,
        quantity,
        outcomeId: selectedOutcome.id,
        ...(orderType === EOrderType.LIMIT && { price: limitPrice }),
      },
      {
        onSuccess: (data) => {
          data.success
            ? toast.success("Order created successfully")
            : toast.error("Order creation failed");
        },
      },
    );
  };

  if (trendingMarket.isLoading || marketSocket.isSocketLoading) {
    return <Loading />;
  }

  if (trendingMarket.isSuccess) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mt-1">
                  {trendingMarket.data.market.name}
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {outcomes.slice(0, MAX_OUTCOMES_VISIBLE).map((o) => (
                <Button
                  key={o.id}
                  variant="outline"
                  onClick={() => {
                    setSelectedOutcome(o);
                    setIsDialogOpen(true);
                  }}
                >
                  {o.name} {o.price}
                </Button>
              ))}
              {hasMoreOutcomes && (
                <Button asChild variant="secondary">
                  <Link to="/abc">Show more outcomes</Link>
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {mostUpvotedComment && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bet-positive to-bet-positive/60 flex items-center justify-center text-bet-positive-foreground text-sm font-semibold flex-shrink-0">
                    {mostUpvotedComment?.account?.user?.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {mostUpvotedComment?.account?.user?.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {timeAgo(mostUpvotedComment?.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {mostUpvotedComment?.comment}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex justify-center items-center gap-2 text-green-500">
                  <CoinsIcon />
                  <span className="text-muted-foreground text-sm">
                    Total Volume: {totalVolume ?? 0}
                  </span>
                </div>
                {mostUpvotedComment && (
                  <Link
                    to="/abc"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>More comments</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedOutcome?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="rounded-3xl"
                  variant={orderSide === EOrderSide.BUY ? "default" : "outline"}
                  onClick={() => setOrderSide(EOrderSide.BUY)}
                >
                  Buy
                </Button>
                <Button
                  size="sm"
                  variant={
                    orderSide === EOrderSide.SELL ? "default" : "outline"
                  }
                  className="rounded-3xl"
                  onClick={() => setOrderSide(EOrderSide.SELL)}
                >
                  Sell
                </Button>
              </div>

              <Select
                value={orderType}
                onValueChange={(v) => setOrderType(v as EOrderType)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EOrderType.MARKET}>Market</SelectItem>
                  <SelectItem value={EOrderType.LIMIT}>Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Form */}
            <div className="space-y-4">
              {orderType === EOrderType.LIMIT && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    Limit price (¢)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border p-2"
                    min={0.01}
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(Number(e.target.value))}
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">
                  Quantity
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border p-2"
                  min={0.01}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              {orderType === EOrderType.MARKET && (
                <div className="flex items-center justify-between text-sm text-muted-foreground border rounded-md p-2">
                  <span>Expiration</span>
                  <span className="font-medium text-foreground">
                    Good ’til cancelled
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="pt-2">
              {!isLoggedIn && (
                <Button className="w-full" asChild>
                  <Link to="/signup">Sign up to trade</Link>
                </Button>
              )}

              {isLoggedIn && !hasTradingAccount && (
                <Button className="w-full" asChild>
                  <Link to="/create-trading-account">
                    Create trading account
                  </Link>
                </Button>
              )}

              {isLoggedIn && hasTradingAccount && (
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {orderSide === "BUY" ? "Buy" : "Sell"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
};

export default TrendingMarketCard;
