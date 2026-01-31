import {
  BookDepthSocketEvent,
  IOutcome,
  MarketDataSocketEvent,
} from "@/lib/market";
import { useCurrentUser } from "@/schemas/layout/hooks";
import { useCreateOrder } from "@/schemas/orders/hooks";
import { EOrderSide, EOrderType } from "@/schemas/orders/schema";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { buildChartData } from "@/lib/market/build-chart-data";
import { socketService } from "@/services/socket";
import { toast } from "sonner";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import ProbabilityChart from "@/components/common/probability-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DecimalInput } from "@/components/common/decimal-input";
import { IntegerInput } from "@/components/common/integer-input";
import { useMarketTimer } from "@/hooks/use-market-timer";
import RootLayout from "@/layout/rootLayout";
import Header from "@/components/header/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useBookDepthByOutcomeId,
  useMarketById,
  useMarketDataById,
  useMarketDataHistoryById,
} from "@/schemas/market/hooks";
import {
  TBookDepthByOutcomeIdResponse,
  TMarketDataHistoryByIdResponse,
} from "@/schemas/market/schema";
import { OrderBook } from "@/components/common/orderbook";

export default function Market() {
  const currentUser = useCurrentUser();
  const params = useParams();
  const id = Number(params.id);
  const trendingMarket = useMarketById(id);
  const marketData = useMarketDataById(id);
  const marketDataHistory = useMarketDataHistoryById(id);
  const { mutate, isPending } = useCreateOrder();
  const [selectedOutcome, setSelectedOutcome] = useState<IOutcome | null>(null);
  const [orderType, setOrderType] = useState<EOrderType>(EOrderType.LIMIT);
  const [orderSide, setOrderSide] = useState<EOrderSide>(EOrderSide.BUY);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<IOutcome[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [liveMarketHistory, setLiveMarketHistory] = useState<
    TMarketDataHistoryByIdResponse["data"]
  >([]);
  const [liveBookDepth, setLiveBookDepth] = useState<
    Partial<TBookDepthByOutcomeIdResponse>
  >({
    bids: [],
    asks: [],
  });
  const isLoggedIn = Boolean(currentUser);
  const hasTradingAccount = Boolean(currentUser?.data?.user?.accountId);
  const bookDepth = useBookDepthByOutcomeId(selectedOutcome?.outcomeId);

  const outcomeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    outcomes.forEach((o) => {
      map[o.outcomeId] = o.outcomeName;
    });
    return map;
  }, [outcomes]);

  const timerText = useMarketTimer(
    trendingMarket?.data?.market?.startsAt,
    trendingMarket?.data?.market?.endsAt,
  );

  const handleMarketData = useCallback(
    (event: MarketDataSocketEvent) => {
      if (event.marketId !== id) return;
      const ticksByOutcomeId = new Map(event.data.map((d) => [d.outcomeId, d]));
      setOutcomes((prevOutcomes) => {
        const updatedOutcomes = prevOutcomes.map((outcome) => {
          const tick = ticksByOutcomeId.get(outcome.outcomeId);
          if (!tick) {
            return outcome;
          }
          return {
            ...outcome,
            fairPrice:
              tick.fairPrice !== null
                ? Math.round(tick.fairPrice * 100) / 100
                : outcome.fairPrice,
            totalVolume: Math.round(tick.totalVolume * 100) / 100,
          };
        });
        const newTotalVolume = updatedOutcomes.reduce(
          (sum, o) => sum + o.totalVolume,
          0,
        );
        setTotalVolume(Math.round(newTotalVolume * 100) / 100);
        return updatedOutcomes;
      });

      setLiveMarketHistory((prev) =>
        prev.map((outcome) => {
          const tick = event.data.find(
            (d) => d.outcomeId === outcome.outcomeId,
          );
          if (!tick) return outcome;
          return {
            ...outcome,
            history: [
              ...outcome.history,
              {
                time: new Date(event.timestamp).toISOString(),
                fairPrice: Math.round((tick.fairPrice * 100) / 100),
                totalVolume: Math.round((tick.totalVolume * 100) / 100),
              },
            ],
          };
        }),
      );
    },
    [id],
  );

  useSocketEvent<MarketDataSocketEvent>("market.data", handleMarketData);

  const handleBookDepth = useCallback(
    (event: BookDepthSocketEvent) => {
      if (event.outcome_id !== selectedOutcome?.outcomeId) return;
      setLiveBookDepth({
        bids: event.bids,
        asks: event.asks,
      });
    },
    [selectedOutcome?.outcomeId],
  );

  useSocketEvent<BookDepthSocketEvent>("book.depth", handleBookDepth);

  const chartData = useMemo(() => {
    if (!liveMarketHistory.length) return [];
    return buildChartData(liveMarketHistory, outcomeNameById);
  }, [liveMarketHistory, outcomeNameById]);

  useEffect(() => {
    if (!marketDataHistory.isSuccess) return;
    setLiveMarketHistory(marketDataHistory.data.data);
  }, [marketDataHistory.isSuccess]);

  useEffect(() => {
    if (!bookDepth.isSuccess) return;
    setLiveBookDepth(bookDepth.data);
  }, [bookDepth.isSuccess]);

  useEffect(() => {
    if (!marketData?.isSuccess) return;
    const outcomes = marketData?.data?.data;
    let totalVolume = 0;
    outcomes.forEach((outcome) => {
      totalVolume += outcome.totalVolume;
    });
    setTotalVolume(Math.round((totalVolume * 100) / 100));
    setOutcomes(outcomes);
    if (outcomes.length) {
      setSelectedOutcome(outcomes[0]);
    }
  }, [marketData?.isSuccess, marketData?.data?.data]);

  useEffect(() => {
    if (!currentUser?.data?.user?.accountId) return;
    socketService.registerAccount(currentUser?.data?.user?.accountId);
    return () => {
      socketService.unregisterAccount(currentUser?.data?.user?.accountId);
    };
  }, [currentUser?.data?.user?.accountId]);

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

  if (trendingMarket?.isSuccess && selectedOutcome) {
    return (
      <RootLayout isPrivate={false} currentUser={currentUser.data || null}>
        <div className="bg-background min-h-screen flex flex-col overflow-hidden">
          <Header
            selectedTab="market"
            currentUser={currentUser.data?.user || null}
            noSearchMarket={true}
          />
          <div className="bg-card rounded-lg px-4 md:px-6 w-[94%] mx-auto flex-1 overflow-hidden">
            <div className="p-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 h-full">
              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mt-1">
                      {trendingMarket.data.market.name}
                    </h2>
                  </div>
                </div>
                <div className="px-4 border-l border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {timerText}
                    </div>
                  </div>
                  <ProbabilityChart
                    data={chartData}
                    outcomes={outcomes.map((o) => ({
                      name: o.outcomeName,
                      percentage: o.fairPrice ? Math.round(o.fairPrice) : 0,
                      color: o.outcomeColor ?? "#000000",
                    }))}
                    currentTimestamp={new Date().toLocaleString()}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex justify-center items-center gap-2 text-green-500">
                      $
                      <span className="text-muted-foreground text-sm">
                        Total Volume: {totalVolume ? totalVolume / 100 : 0}
                      </span>
                    </div>
                  </div>
                </div>
                <Accordion
                  defaultValue={selectedOutcome?.outcomeId ?? null}
                  type="single"
                  collapsible
                  className="pt-4 space-y-2"
                >
                  {outcomes.map((outcome) => (
                    <AccordionItem
                      key={outcome.outcomeId}
                      value={outcome.outcomeId}
                      onClick={() => setSelectedOutcome(outcome)}
                      className="border border-border rounded-lg px-2"
                    >
                      <AccordionTrigger className="text-left font-medium">
                        {outcome.outcomeName}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {bookDepth.isLoading && <Loading />}
                        {bookDepth.isError && (
                          <p>Some error occoured, please try again later</p>
                        )}
                        {bookDepth.isSuccess && bookDepth?.data && (
                          <OrderBook
                            bids={liveBookDepth.bids}
                            asks={liveBookDepth.asks}
                            success={bookDepth.isSuccess}
                          />
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <Card className="w-full max-w-md lg:sticky lg:top-6 self-start">
                <CardHeader>
                  <CardTitle>{selectedOutcome?.outcomeName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Buy / Sell + Order Type */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="rounded-3xl"
                        variant={
                          orderSide === EOrderSide.BUY ? "default" : "outline"
                        }
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
                        <SelectItem value={EOrderType.MARKET}>
                          Market
                        </SelectItem>
                        <SelectItem value={EOrderType.LIMIT}>Limit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      <IntegerInput
                        value={quantity}
                        onValueChange={setQuantity}
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
                      <Button
                        className="w-full"
                        asChild
                        style={{
                          backgroundColor:
                            selectedOutcome?.outcomeColor || "default",
                          color:
                            selectedOutcome?.outcomeColor === "default"
                              ? "black"
                              : "white",
                        }}
                      >
                        <Link to="/signup">Sign up to trade</Link>
                      </Button>
                    )}

                    {isLoggedIn && !hasTradingAccount && (
                      <Button
                        className="w-full"
                        asChild
                        style={{
                          backgroundColor:
                            selectedOutcome?.outcomeColor || "default",
                          color:
                            selectedOutcome?.outcomeColor === "default"
                              ? "black"
                              : "white",
                        }}
                      >
                        <Link to="/create-trading-account">
                          Create trading account
                        </Link>
                      </Button>
                    )}

                    {isLoggedIn && hasTradingAccount && (
                      <Button
                        className="w-full"
                        style={{
                          backgroundColor:
                            selectedOutcome?.outcomeColor || "default",
                          color:
                            selectedOutcome?.outcomeColor === "default"
                              ? "black"
                              : "white",
                        }}
                        onClick={handleSubmit}
                        disabled={
                          isPending ||
                          (orderType === EOrderType.MARKET && !quantity) ||
                          (orderType === EOrderType.LIMIT &&
                            (!limitPrice || !quantity))
                        }
                      >
                        {orderSide === EOrderSide.BUY ? "Buy" : "Sell"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }
}
