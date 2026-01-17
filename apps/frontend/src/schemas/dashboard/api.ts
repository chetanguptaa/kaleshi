import { fetcher } from "@/api/fetcher";
import {
  marketByIdResponseSchema,
  marketCategoriesListResponseSchema,
  marketCategoryByIdResponseSchema,
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

export function getMarketsBySelection(selection: TMarketSelection) {
  const id =
    selection.type === "filter" ? selection.value : selection.categoryId;

  return fetcher({
    config: {
      url: `/market-category/${id}/markets`,
      method: "GET",
    },
    schema: marketsListResponseSchema,
  });
}
