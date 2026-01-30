import { getMarketCategories, getMarketCategoryById } from "./api";
import { useApiQuery } from "@/hooks/use-api-query";

export const useMarketCategories = () => {
  return useApiQuery(["marketCategories"], getMarketCategories);
};

export const useMarketCategoryById = (id?: number) => {
  return useApiQuery(["marketCategory", id], () => getMarketCategoryById(id!), {
    enabled: typeof id === "number",
  });
};
