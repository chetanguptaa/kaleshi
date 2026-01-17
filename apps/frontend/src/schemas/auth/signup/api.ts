import { mutate } from "@/api/mutate";
import {
  signupRequestSchema,
  signupResponseSchema,
  TSignupRequest,
} from "./schemas";

export const signup = (data: TSignupRequest) =>
  mutate({
    config: {
      url: "/auth/signup",
      method: "POST",
      withCredentials: true,
    },
    requestSchema: signupRequestSchema,
    responseSchema: signupResponseSchema,
    data,
  });
