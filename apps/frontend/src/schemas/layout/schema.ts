import { z } from "zod";

export const userSchema = z
  .object({
    sub: z.number(),
    accountId: z.string().optional(),
    name: z.string(),
    email: z.email(),
    roles: z.array(z.string()),
  })
  .loose();

export const getCurrentUserResponseSchema = z
  .object({
    success: z.boolean(),
    user: userSchema,
  })
  .loose();

export type TCurrentUser = z.infer<typeof userSchema>;
export type TGetCurrentUserResponse = z.infer<
  typeof getCurrentUserResponseSchema
>;
