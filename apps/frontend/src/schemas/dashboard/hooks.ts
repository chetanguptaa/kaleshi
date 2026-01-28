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

export function useMarketSocket(marketId: number, accountId: number | null) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    socketService
      .subscribeToMarket(marketId, accountId)
      .then(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
      socketService.unsubscribeFromMarket(marketId, accountId);
    };
  }, [marketId]);
  return { isSocketLoading: isLoading };
}
