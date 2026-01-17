import { mutate } from "@/api/mutate";
import {
  SignupRequestSchema,
  SignupResponseSchema,
  TSignupRequest,
} from "./schemas";

export const signup = (data: TSignupRequest) =>
  mutate({
    config: {
      url: "/auth/signup",
      method: "POST",
      withCredentials: true,
    },
    requestSchema: SignupRequestSchema,
    responseSchema: SignupResponseSchema,
    data,
  });
