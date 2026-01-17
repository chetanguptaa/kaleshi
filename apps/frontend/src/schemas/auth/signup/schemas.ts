import { z } from "zod";

export const SignupRequestSchema = z.object({
  email: z.email(),
  name: z.string().min(3),
  password: z.string().min(8),
});

export const SignupResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
});

export type TSignupRequest = z.infer<typeof SignupRequestSchema>;
export type TSignupResponse = z.infer<typeof SignupResponseSchema>;
