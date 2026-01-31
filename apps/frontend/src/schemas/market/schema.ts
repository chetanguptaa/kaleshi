import { z } from "zod";

export const outcomeSchema = z
  .object({
    outcomeId: z.string(),
    outcomeName: z.string(),
    outcomeColor: z.string(),
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
    bettingStartAt: z.string(),
    bettingEndAt: z.string(),
    eventStartAt: z.string(),
    eventEndAt: z.string(),
    outcomes: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
      }),
    ),
    marketCategoryId: z.number().int(),
    status: z.enum([
      "DEACTIVATED",
      "DRAFT",
      "OPEN",
      "CLOSED",
      "SETTLING",
      "SETTLED",
      "CANCELLED",
    ]),
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
    status: z.enum([
      "DEACTIVATED",
      "DRAFT",
      "OPEN",
      "CLOSED",
      "SETTLING",
      "SETTLED",
      "CANCELLED",
    ]),
    bettingStartAt: z.string(),
    bettingEndAt: z.string(),
    eventStartAt: z.string(),
    eventEndAt: z.string(),
  })
  .loose();

export const marketsListResponseSchema = z
  .object({
    success: z.boolean(),
    markets: z.array(marketSchema),
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
    bids: z.array(z.array(z.number()).min(2).max(2)),
    asks: z.array(z.array(z.number()).min(2).max(2)),
  })
  .loose();

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

export enum ETimeInForce {
  GTC = "GTC",
  IOC = "IOC",
  FOK = "FOK",
}
