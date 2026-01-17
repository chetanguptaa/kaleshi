import { z } from "zod";

export const signupRequestSchema = z.object({
  email: z.email(),
  name: z.string().min(3),
  password: z.string().min(8),
});

export const signupResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
});

export type TSignupRequest = z.infer<typeof signupRequestSchema>;
export type TSignupResponse = z.infer<typeof signupResponseSchema>;
