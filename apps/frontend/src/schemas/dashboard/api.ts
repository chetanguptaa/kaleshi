import { fetcher } from "@/api/fetcher";
import {
  marketCategoriesListResponseSchema,
  marketCategoryByIdResponseSchema,
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
