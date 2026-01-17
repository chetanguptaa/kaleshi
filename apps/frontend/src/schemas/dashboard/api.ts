import { fetcher } from "@/api/fetcher";
import {
  MarketCategoriesListResponseSchema,
  MarketsListResponseSchema,
  TMarketSelection,
} from "./schema";

export const getMarketCategories = () =>
  fetcher({
    config: {
      url: "/market-category",
      method: "GET",
    },
    schema: MarketCategoriesListResponseSchema,
  });

export function getMarketsBySelection(selection: TMarketSelection) {
  const id =
    selection.type === "filter" ? selection.value : selection.categoryId;

  return fetcher({
    config: {
      url: `/market-category/${id}`,
      method: "GET",
    },
    // schema: MarketListSchema,
    schema: MarketsListResponseSchema,
  });
}
