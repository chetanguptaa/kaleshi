import { mutate } from "@/api/mutate";
import {
  loginRequestSchema,
  loginResponseSchema,
  TLoginRequest,
} from "./schemas";

export const login = (data: TLoginRequest) =>
  mutate({
    config: {
      url: "/auth/login",
      method: "POST",
      withCredentials: true,
    },
    requestSchema: loginRequestSchema,
    responseSchema: loginResponseSchema,
    data,
  });
