import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
});

export type TLoginRequest = z.infer<typeof LoginRequestSchema>;
export type TLoginResponse = z.infer<typeof LoginResponseSchema>;
