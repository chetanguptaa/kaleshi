import {
  getBookDepth,
  getMarketById,
  getMarketCategories,
  getMarketCategoryById,
  getMarketData,
  getMarketDataHistory,
  getMarketsBySelection,
} from "./api";
import { useApiQuery } from "@/hooks/use-api-query";
import { TMarketSelection } from "./schema";
import { queryClient } from "@/query/query-client";

export const useMarketCategories = () => {
  return useApiQuery(["marketCategories"], getMarketCategories);
};

export const useMarketCategoryById = (id?: number) => {
  return useApiQuery(["marketCategory", id], () => getMarketCategoryById(id!), {
    enabled: typeof id === "number",
  });
};
export const useMarkets = (selection: TMarketSelection) => {
  return useApiQuery(
    ["markets", selection],
    () => getMarketsBySelection(selection),
    {
      enabled: !!selection,
    },
  );
};

export const useMarketById = (id?: number) => {
  return useApiQuery(["market", id], () => getMarketById(id!), {
    enabled: typeof id === "number",
  });
};

export const useMarketDataById = (id: number) => {
  return useApiQuery(["marketData", id], () => getMarketData(id), {
    enabled: typeof id === "number",
  });
};

export const useBookDepthByOutcomeId = (id: string) => {
  return useApiQuery(["marketBookDepth", id], () => getBookDepth(id!), {
    enabled: typeof id === "string",
  });
};

export const useMarketDataHistoryById = (id: number) => {
  return useApiQuery(
    ["marketDataHistory", id],
    () => getMarketDataHistory(id),
    {
      enabled: typeof id === "number",
    },
  );
};

export function useMarketsPrefetch() {
  return (selection: TMarketSelection) => {
    queryClient.prefetchQuery({
      queryKey: ["markets", selection],
      queryFn: () => getMarketsBySelection(selection),
      staleTime: 5 * 60 * 1000,
    });
  };
}
