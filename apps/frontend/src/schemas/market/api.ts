import { fetcher } from "@/api/fetcher";
import {
  bookDepthByOutcomeIdResponseSchema,
  marketByIdResponseSchema,
  marketDataByIdResponseSchema,
  marketDataHistoryByIdResponseSchema,
  marketsListResponseSchema,
  TMarketSelection,
} from "./schema";

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
