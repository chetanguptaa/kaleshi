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
import {
  useMarketById,
  useMarketDataById,
  useMarketDataHistoryById,
} from "@/schemas/dashboard/hooks";
import { TCurrentUser } from "@/schemas/layout/schema";
import { useCreateOrder } from "@/schemas/orders/hooks";
import { EOrderSide, EOrderType } from "@/schemas/orders/schema";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MAX_OUTCOMES_VISIBLE } from "../constants";
import {
  calculatePotentialWin,
  formatDate,
  getMostUpvotedComment,
  timeAgo,
} from "../utils";
import { DecimalInput } from "@/components/common/decimal-input";
import OutcomeButton from "@/components/common/outcome-button";
import ProbabilityChart from "@/components/common/probability-chart";
import { socketService } from "@/services/socket";
import { useMarketTimer } from "@/hooks/use-market-timer";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { TMarketDataHistoryByIdResponse } from "@/schemas/dashboard/schema";
import { IntegerInput } from "@/components/common/integer-input";

interface IOutcome {
  outcomeId: string;
  outcomeName: string;
  totalVolume: number;
  fairPrice?: number;
}

type MarketDataSocketEvent = {
  type: "market.data";
  marketId: number;
  timestamp: number;
  data: {
    outcomeId: string;
    fairPrice: number | null;
    totalVolume: number;
  }[];
};

const buildChartData = (
  historyData: {
    outcomeId: string;
    outcomeName: string;
    history: { time: string; totalVolume: number; fairPrice?: number }[];
  }[],
  outcomeNameById: Record<string, string>,
) => {
  const rowsByTime = new Map<string, any>();
  for (const outcome of historyData) {
    const outcomeName = outcomeNameById[outcome.outcomeId];
    if (!outcomeName) continue;
    for (const point of outcome.history) {
      if (!rowsByTime.has(point.time)) {
        rowsByTime.set(point.time, {
          timestamp: point.time,
          date: formatDate(point.time),
        });
      }
      rowsByTime.get(point.time)[outcomeName.replace(" ", "")] =
        point.fairPrice !== null ? Math.round(point.fairPrice * 100) : null;
    }
  }
  return Array.from(rowsByTime.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
};

const TrendingMarketCard = ({
  id,
  currentUser,
}: {
  id: number;
  currentUser: TCurrentUser | null;
}) => {
  const trendingMarket = useMarketById(id);
  const marketData = useMarketDataById(id);
  const marketDataHistory = useMarketDataHistoryById(id);
  const { mutate, isPending } = useCreateOrder();
  const [selectedOutcome, setSelectedOutcome] = useState<IOutcome | null>(null);
  const [orderType, setOrderType] = useState<EOrderType>(EOrderType.LIMIT);
  const [orderSide, setOrderSide] = useState<EOrderSide>(EOrderSide.BUY);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [outcomes, setOutcomes] = useState<IOutcome[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [liveMarketHistory, setLiveMarketHistory] = useState<
    TMarketDataHistoryByIdResponse["data"]
  >([]);
  const isLoggedIn = Boolean(currentUser);
  const hasTradingAccount = Boolean(currentUser?.accountId);

  let mostUpvotedComment = getMostUpvotedComment(
    trendingMarket?.data?.market?.comments || [],
  );

  const hasMoreOutcomes = outcomes.length > MAX_OUTCOMES_VISIBLE;

  const outcomeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    outcomes.forEach((o) => {
      map[o.outcomeId] = o.outcomeName;
    });
    return map;
  }, [outcomes]);

  const chartData = useMemo(() => {
    if (!marketDataHistory.isSuccess) return [];
    if (
      !marketDataHistory?.data ||
      !marketDataHistory?.data?.data ||
      !outcomes.length
    )
      return [];
    return buildChartData(marketDataHistory?.data?.data, outcomeNameById);
  }, [marketDataHistory, outcomeNameById]);

  const timerText = useMarketTimer(
    trendingMarket?.data?.market?.startsAt,
    trendingMarket?.data?.market?.endsAt,
  );

  useSocketEvent<MarketDataSocketEvent>("market.data", (event) => {
    if (event.marketId !== id) return;
    setLiveMarketHistory((prev) =>
      prev.map((outcome) => {
        const tick = event.data.find((d) => d.outcomeId === outcome.outcomeId);
        if (!tick) return outcome;
        return {
          ...outcome,
          history: [
            ...outcome.history,
            {
              time: new Date(event.timestamp).toISOString(),
              fairPrice: tick.fairPrice,
              totalVolume: tick.totalVolume,
            },
          ],
        };
      }),
    );
  });

  useEffect(() => {
    if (!marketDataHistory.isSuccess) return;
    setLiveMarketHistory(marketDataHistory.data.data);
  }, [marketDataHistory.isSuccess]);

  useEffect(() => {
    if (!marketData?.isSuccess) return;
    const outcomes = marketData?.data?.data;
    let totalVolume = 0;
    outcomes.forEach((outcome) => {
      totalVolume += outcome.totalVolume;
    });
    setTotalVolume(totalVolume);
    setOutcomes(outcomes);
  }, [marketData]);

  useEffect(() => {
    if (!currentUser?.accountId) return;
    socketService.registerAccount(currentUser?.accountId);
    return () => {
      socketService.unregisterAccount(currentUser?.accountId);
    };
  }, [currentUser?.accountId]);

  useEffect(() => {
    if (!id) return;
    socketService.subscribeToMarket(id);
    return () => {
      socketService.unsubscribeFromMarket(id);
    };
  }, [id]);

  useEffect(() => {
    if (!selectedOutcome?.outcomeId) return;
    socketService.subscribeToOutcome(selectedOutcome?.outcomeId);
    return () => {
      socketService.unsubscribeFromOutcome(selectedOutcome?.outcomeId);
    };
  }, [selectedOutcome?.outcomeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) return;
    mutate(
      {
        side: orderSide,
        orderType,
        quantity,
        outcomeId: selectedOutcome?.outcomeId,
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

  if (
    trendingMarket?.isLoading ||
    marketData?.isLoading ||
    marketDataHistory?.isLoading
  ) {
    return <Loading />;
  }

  if (trendingMarket?.isSuccess) {
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
              {outcomes.slice(0, MAX_OUTCOMES_VISIBLE).map((o, index) => (
                <OutcomeButton
                  key={o.outcomeId}
                  name={o.outcomeName}
                  price={o.fairPrice || 0}
                  potentialWin={calculatePotentialWin(o.fairPrice)}
                  variant={index === 0 ? "positive" : "negative"}
                  onClick={() => {
                    // handleOutcomeClick(o);
                    setSelectedOutcome(o);
                    setIsDialogOpen(true);
                  }}
                />
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
                  $
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
          {/* Right side - Chart */}
          <div className="px-4 border-l border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{timerText}</div>
            </div>
            <ProbabilityChart
              data={chartData}
              outcomes={outcomes.map((o) => ({
                name: o.outcomeName,
                percentage: o.fairPrice ? Math.round(o.fairPrice * 100) : 0,
                color:
                  o.fairPrice && o.fairPrice > 0.5 ? "positive" : "negative",
              }))}
              currentTimestamp={new Date().toLocaleString()}
            />
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedOutcome?.outcomeName}</DialogTitle>
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
                    Limit price ($)
                  </label>
                  <DecimalInput
                    value={limitPrice}
                    onValueChange={setLimitPrice}
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">
                  Quantity
                </label>
                <IntegerInput value={quantity} onValueChange={setQuantity} />
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
                  disabled={
                    isPending ||
                    (orderType === EOrderType.MARKET && !quantity) ||
                    (orderType === EOrderType.LIMIT &&
                      (!limitPrice || !quantity))
                  }
                >
                  {orderSide === "Buy" ? "Buy" : "Sell"}
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
