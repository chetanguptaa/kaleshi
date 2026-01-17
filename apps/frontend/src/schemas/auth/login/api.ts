import { mutate } from "@/api/mutate";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  TLoginRequest,
} from "./schemas";

export const login = (data: TLoginRequest) =>
  mutate({
    config: {
      url: "/auth/login",
      method: "POST",
      withCredentials: true,
    },
    requestSchema: LoginRequestSchema,
    responseSchema: LoginResponseSchema,
    data,
  });
