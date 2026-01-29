import { fetcher } from "@/api/fetcher";
import {
  bookDepthByOutcomeIdResponseSchema,
  marketByIdResponseSchema,
  marketCategoriesListResponseSchema,
  marketCategoryByIdResponseSchema,
  marketDataByIdResponseSchema,
  marketDataHistoryByIdResponseSchema,
  marketsListResponseSchema,
  TMarketSelection,
} from "./schema";

export const getMarketCategories = () => {
  return fetcher({
    config: {
      url: "/market-category",
      method: "GET",
    },
    schema: marketCategoriesListResponseSchema,
  });
};

export const getMarketCategoryById = (id: number) => {
  return fetcher({
    config: {
      url: `/market-category/${id}`,
      method: "GET",
    },
    schema: marketCategoryByIdResponseSchema,
  });
};

export const getMarketById = (id: number) => {
  return fetcher({
    config: {
      url: `/market/${id}`,
      method: "GET",
    },
    schema: marketByIdResponseSchema,
  });
};

export const getMarketsBySelection = (selection: TMarketSelection) => {
  const id =
    selection.type === "filter" ? selection.value : selection.categoryId;

  return fetcher({
    config: {
      url: `/market-category/${id}/markets`,
      method: "GET",
    },
    schema: marketsListResponseSchema,
  });
};

export const getMarketData = (id: number) => {
  return fetcher({
    config: {
      url: `/market/${id}/market-data`,
      method: "GET",
    },
    schema: marketDataByIdResponseSchema,
  });
};

export const getBookDepth = (id: string) => {
  return fetcher({
    config: {
      url: `/outcome/${id}/depth`,
      method: "GET",
    },
    schema: bookDepthByOutcomeIdResponseSchema,
  });
};

export const getMarketDataHistory = (id: number) => {
  return fetcher({
    config: {
      url: `/market/${id}/market-data/history`,
      method: "GET",
    },
    schema: marketDataHistoryByIdResponseSchema,
  });
};
