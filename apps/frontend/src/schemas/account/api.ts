import { mutate } from "@/api/mutate";
import {
  createTradingAccountResponseSchema,
  getUserAccountResponseSchema,
} from "./schema";
import { fetcher } from "@/api/fetcher";

export const createTradingAccount = () =>
  mutate({
    config: {
      url: "/accounts",
      method: "POST",
      withCredentials: true,
    },
    responseSchema: createTradingAccountResponseSchema,
  });

export const getCurrentUserAccount = () => {
  return fetcher({
    config: {
      url: "/accounts",
      method: "GET",
      withCredentials: true,
    },
    schema: getUserAccountResponseSchema,
  });
};
