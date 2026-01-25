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
import { socketService } from "@/services/socket";

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

export function useAccountSocket(accountId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        setIsLoading(true);
        if (accountId) {
          await socketService.registerAccount(accountId);
        }
      } catch (error) {
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    setup();
    return () => {
      cancelled = true;
      if (accountId) {
        socketService.unregisterAccount(accountId);
      }
    };
  }, [accountId]);
  return { isAccountSocketLoading: isLoading };
}

export function useMarketSocket(marketId: number) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        setIsLoading(true);
        await socketService.subscribeToMarket(marketId);
      } catch (error) {
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    setup();
    return () => {
      cancelled = true;
      socketService.unsubscribeFromMarket(marketId);
    };
  }, [marketId]);
  return { isMarketSocketLoading: isLoading };
}

export function useOutcomeSocket(outcomeId?: string) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!outcomeId) return;
    let cancelled = false;
    async function setup() {
      try {
        setIsLoading(true);
        await socketService.subscribeToOutcome(outcomeId);
      } catch (error) {
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    setup();
    return () => {
      cancelled = true;
      socketService.unsubscribeFromOutcome(outcomeId);
    };
  }, [outcomeId]);
  return { isOutcomeSocketLoading: isLoading };
}
