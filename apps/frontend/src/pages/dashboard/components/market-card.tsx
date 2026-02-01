import { Link } from "react-router-dom";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  TMarket,
  TMarketDataHistoryByIdResponse,
} from "@/schemas/market/schema";
import { useCallback, useEffect, useState } from "react";
import { IOutcome, MarketDataSocketEvent } from "@/lib/market";
import { useSocketEvent } from "@/hooks/use-socket-event";
import {
  useMarketDataById,
  useMarketDataHistoryById,
} from "@/schemas/market/hooks";

export function MarketCard({ market }: { market: TMarket }) {
  const marketDataHistory = useMarketDataHistoryById(market?.id);
  const marketData = useMarketDataById(market?.id);
  const [totalVolume, setTotalVolume] = useState(0);
  const [outcomes, setOutcomes] = useState<IOutcome[]>([]);
  const [liveMarketHistory, setLiveMarketHistory] = useState<
    TMarketDataHistoryByIdResponse["data"]
  >([]);

  const handleMarketData = useCallback(
    (event: MarketDataSocketEvent) => {
      if (event.marketId !== market?.id) return;
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
    [market?.id],
  );

  useSocketEvent<MarketDataSocketEvent>("market.data", handleMarketData);

  useEffect(() => {
    if (!marketDataHistory.isSuccess) return;
    setLiveMarketHistory(marketDataHistory.data.data);
  }, [marketDataHistory.isSuccess, market?.id]);

  useEffect(() => {
    debugger;
    if (!marketData?.isSuccess) return;
    const outcomes = marketData?.data?.data;
    let totalVolume = 0;
    outcomes.forEach((outcome) => {
      totalVolume += outcome.totalVolume;
    });
    setTotalVolume(Math.round((totalVolume * 100) / 100));
    setOutcomes(outcomes);
  }, [marketData?.isSuccess, marketData?.data?.data]);

  return (
    <Link to={`/market/${market.id}`}>
      <div className="group glass-card p-5 transition-all duration-300  cursor-pointer animate-slide-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
            {market.name}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(market.bettingEndAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {"No description provided"}
        </p>
        <div className="space-y-3">
          {outcomes?.slice(0, 3).map((outcome) => (
            <div
              key={outcome.outcomeId}
              className="flex items-center justify-between"
            >
              <span className="text-sm">{outcome.outcomeName}</span>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    color: outcome?.outcomeColor ?? "black",
                  }}
                  className={`text-xs flex items-center gap-1`}
                >
                  {outcome?.fairPrice >= 0.5 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {outcome?.fairPrice}%
                </span>
              </div>
            </div>
          ))}
          {outcomes?.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{market.outcomes.length - 3} more outcomes
            </p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Volume</span>
          <span className="text-sm font-medium text-black">
            ${totalVolume / 100}
          </span>
        </div>
      </div>
    </Link>
  );
}
