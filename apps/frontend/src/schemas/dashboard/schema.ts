import { z } from "zod";

export const marketCategorySchema = z
  .object({
    id: z.number(),
    name: z.string(),
    metadata: z.object().nullable(),
    children: z
      .array(z.lazy(() => marketCategorySchema))
      .optional()
      .nullable(),
    parentId: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .loose();

export const marketCategoriesListResponseSchema = z
  .object({
    success: z.boolean(),
    marketCategories: z.array(marketCategorySchema),
  })
  .loose();

export const marketCategoryByIdResponseSchema = z
  .object({
    success: z.boolean(),
    marketCategory: marketCategorySchema,
  })
  .loose();

export type TMarketCategoryListResponse = z.infer<
  typeof marketCategoriesListResponseSchema
>;
export type TMarketCategoryByIdResponse = z.infer<
  typeof marketCategoryByIdResponseSchema
>;
export type TMarketCategory = z.infer<typeof marketCategorySchema>;

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
