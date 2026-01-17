import { z } from "zod";

export const MarketCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  information: z
    .object({
      avatar: z.string(),
    })
    .optional(),
  parentId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MarketSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  marketCategoryId: z.number().int(),
  isActive: z.boolean(),
  information: z.json().optional(),
  ruleBook: z.string().optional(),
  rules: z.string().optional(),
});

export const MarketCategoriesListResponseSchema = z.object({
  success: z.boolean(),
  marketCategories: z.array(MarketCategorySchema),
});

export const MarketsListResponseSchema = z.object({
  success: z.boolean(),
  markets: z.array(MarketSchema),
});

export type TMarketCategoryListResponse = z.infer<
  typeof MarketCategoriesListResponseSchema
>;
export type TMarket = z.infer<typeof MarketSchema>;
export type TMarketCategory = z.infer<typeof MarketCategorySchema>;

export type TMarketSelectionFilter = {
  type: "filter";
  value: "trending" | "new" | "all";
};
export type TMarketSelectionCategory = {
  type: "category";
  categoryId: number;
};
export type TMarketSelection =
  | TMarketSelectionCategory
  | TMarketSelectionFilter;
