import { useApiQuery } from "@/hooks/use-api-query";
import { getCurrentUser } from "./api";

export const useCurrentUser = () =>
  useApiQuery(["currentUser"], getCurrentUser);
