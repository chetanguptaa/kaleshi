import { z } from "zod";

export const accountSchema = z
  .object({
    id: z.uuid(),
    coins: z.number(),
  })
  .loose();

export const createTradingAccountResponseSchema = z
  .object({
    success: z.boolean(),
    accountId: z.uuid(),
  })
  .loose();

export const getUserAccountResponseSchema = z
  .object({
    success: z.boolean(),
    account: accountSchema,
  })
  .loose();

export type TCreateTradingAccountResponse = z.infer<
  typeof createTradingAccountResponseSchema
>;
export type TAccount = z.infer<typeof accountSchema>;
export type TGetUserAccountResponse = z.infer<
  typeof getUserAccountResponseSchema
>;
