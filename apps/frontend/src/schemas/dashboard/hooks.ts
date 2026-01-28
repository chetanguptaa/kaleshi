import {
  getMarketById,
  getMarketCategories,
  getMarketCategoryById,
  getMarketsBySelection,
} from "./api";
import { useApiQuery } from "@/hooks/use-api-query";
import { TMarketSelection } from "./schema";
import { queryClient } from "@/query/query-client";
import { useEffect, useState } from "react";
import {
  AccountId,
  MarketId,
  OutcomeId,
  socketService,
} from "@/services/socket";

export const useMarketCategories = () => {
  return useApiQuery(["marketCategories"], getMarketCategories);
};

export const useMarketCategoryById = (id?: number) =>
  useApiQuery(["marketCategory", id], () => getMarketCategoryById(id!), {
    enabled: typeof id === "number",
  });

export const useMarkets = (selection: TMarketSelection) =>
  useApiQuery(["markets", selection], () => getMarketsBySelection(selection));

export const useMarketById = (id?: number) =>
  useApiQuery(["market", id], () => getMarketById(id!), {
    enabled: typeof id === "number",
  });

export function useMarketsPrefetch() {
  return (selection: TMarketSelection) => {
    queryClient.prefetchQuery({
      queryKey: ["markets", selection],
      queryFn: () => getMarketsBySelection(selection),
      staleTime: 5 * 60 * 1000,
    });
  };
}

export function useAccountSocket(accountId?: AccountId) {
  useEffect(() => {
    if (!accountId) return;
    socketService.registerAccount(accountId);
    return () => {
      socketService.unregisterAccount(accountId);
    };
  }, [accountId]);
}

export function useMarketSocket(marketId?: MarketId) {
  useEffect(() => {
    if (!marketId) return;
    socketService.subscribeToMarket(marketId);
    return () => {
      socketService.unsubscribeFromMarket(marketId);
    };
  }, [marketId]);
}

export function useOutcomeSocket(outcomeId?: OutcomeId) {
  useEffect(() => {
    if (!outcomeId) return;
    socketService.subscribeToOutcome(outcomeId);
    return () => {
      socketService.unsubscribeFromOutcome(outcomeId);
    };
  }, [outcomeId]);
}
