import { getMarketCategories, getMarketsBySelection } from "./api";
import { useApiQuery } from "@/hooks/use-api-query";
import { TMarketSelection } from "./schema";
import { queryClient } from "@/query/query-client";

export const useMarketCategories = () => {
  return useApiQuery(["marketCategories"], getMarketCategories);
};

export const useMarkets = (selection: TMarketSelection) =>
  useApiQuery(["markets", selection], () => getMarketsBySelection(selection), {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
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
