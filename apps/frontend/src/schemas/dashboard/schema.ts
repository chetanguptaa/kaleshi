import { z } from "zod";

export const marketCategorySchema = z
  .object({
    id: z.number(),
    name: z.string(),
    information: z
      .object({
        avatar: z.string(),
      })
      .optional(),
    children: z.array(z.lazy(() => marketCategorySchema)).optional(),
    parentId: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .loose();

export const outcomeSchema = z
  .object({
    name: z.string(),
    ticker: z.string(),
    id: z.string(),
  })
  .loose();

export const marketSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    startsAt: z.string(),
    endsAt: z.string(),
    outcomes: z.array(outcomeSchema),
    marketCategoryId: z.number().int(),
    isActive: z.boolean(),
    information: z.json().optional(),
    ruleBook: z.string().optional(),
    rules: z.string().optional(),
  })
  .loose();

export const marketByIdSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    outcomes: z.array(
      z.object({
        name: z.string(),
        ticker: z.string(),
      }),
    ),
    information: z.json(),
    comments: z.array(
      z.object({
        account: z.object({
          user: z.object({
            name: z.string(),
          }),
        }),
        comment: z.string(),
        createdAt: z.string(),
        _count: z.object({
          votes: z.number(),
        }),
        votes: z.array(
          z.object({
            id: z.string(),
            vote: z.enum(["UP", "DOWN"]),
          }),
        ),
      }),
    ),
    isActive: z.boolean(),
  })
  .loose();

export const marketCategoriesListResponseSchema = z
  .object({
    success: z.boolean(),
    marketCategories: z.array(marketCategorySchema),
  })
  .loose();

export const marketsListResponseSchema = z
  .object({
    success: z.boolean(),
    markets: z.array(marketSchema),
  })
  .loose();

export const marketCategoryByIdResponseSchema = z
  .object({
    success: z.boolean(),
    marketCategory: marketCategorySchema,
  })
  .loose();

export const marketByIdResponseSchema = z
  .object({
    success: z.boolean(),
    market: marketByIdSchema,
  })
  .loose();

export type TMarketCategoryListResponse = z.infer<
  typeof marketCategoriesListResponseSchema
>;
export type TMarketCategoryByIdResponse = z.infer<
  typeof marketCategoryByIdResponseSchema
>;
export type TMarket = z.infer<typeof marketSchema>;
export type TMarketCategory = z.infer<typeof marketCategorySchema>;
export type TMarketById = z.infer<typeof marketByIdSchema>;
export type TMarketByIdResponse = z.infer<typeof marketByIdResponseSchema>;

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
