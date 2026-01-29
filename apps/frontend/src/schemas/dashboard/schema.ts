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

export const outcomeSchema = z
  .object({
    outcomeId: z.string(),
    outcomeName: z.string(),
    fairPrice: z.number().nullable(),
    totalVolume: z.number(),
  })
  .loose();

export const commentSchema = z
  .object({
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
  })
  .loose();

export const marketSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    startsAt: z.string(),
    endsAt: z.string(),
    outcomes: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
      }),
    ),
    marketCategoryId: z.number().int(),
    isActive: z.boolean(),
    metadata: z.json().optional().nullable(),
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
        id: z.string(),
      }),
    ),
    metadata: z.json().nullable().optional(),
    comments: z.array(commentSchema),
    isActive: z.boolean(),
    startsAt: z.string(),
    endsAt: z.string(),
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

export const marketDataByIdResponseSchema = z
  .object({
    success: z.boolean(),
    marketId: z.number(),
    data: z.array(outcomeSchema),
  })
  .loose();

export const marketDataHistoryByIdResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(
      z.object({
        outcomeId: z.string(),
        outcomeName: z.string(),
        history: z.array(
          z.object({
            time: z.string(),
            fairPrice: z.number().nullable(),
            totalVolume: z.number(),
          }),
        ),
      }),
    ),
  })
  .loose();

export const bookDepthByOutcomeIdResponseSchema = z
  .object({
    success: z.boolean(),
    bids: z.array(z.number().min(2).max(2)),
    asks: z.array(z.number().min(2).max(2)),
  })
  .loose();

export type TMarketCategoryListResponse = z.infer<
  typeof marketCategoriesListResponseSchema
>;
export type TMarketCategoryByIdResponse = z.infer<
  typeof marketCategoryByIdResponseSchema
>;
export type TBookDepthByOutcomeIdResponse = z.infer<
  typeof bookDepthByOutcomeIdResponseSchema
>;
export type TMarketDataByIdResponse = z.infer<
  typeof marketDataByIdResponseSchema
>;
export type TMarketDataHistoryByIdResponse = z.infer<
  typeof marketDataHistoryByIdResponseSchema
>;
export type TMarket = z.infer<typeof marketSchema>;
export type TMarketCategory = z.infer<typeof marketCategorySchema>;
export type TMarketById = z.infer<typeof marketByIdSchema>;
export type TMarketByIdResponse = z.infer<typeof marketByIdResponseSchema>;
export type TOutcomeSchema = z.infer<typeof outcomeSchema>;
export type TCommentSchema = z.infer<typeof commentSchema>;

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
