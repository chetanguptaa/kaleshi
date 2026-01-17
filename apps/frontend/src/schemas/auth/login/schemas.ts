import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
});

export type TLoginRequest = z.infer<typeof loginRequestSchema>;
export type TLoginResponse = z.infer<typeof loginResponseSchema>;
