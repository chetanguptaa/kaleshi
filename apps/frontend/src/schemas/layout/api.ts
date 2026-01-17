import { getCurrentUserResponseSchema } from "./schema";
import { fetcher } from "@/api/fetcher";

export const getCurrentUser = () => {
  return fetcher({
    config: {
      url: "/auth/me",
      method: "GET",
      withCredentials: true,
    },
    schema: getCurrentUserResponseSchema,
  });
};
