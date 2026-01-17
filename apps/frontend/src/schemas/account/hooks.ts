import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import { toast } from "sonner";
import { createTradingAccount, getCurrentUserAccount } from "./api";
import { useApiQuery } from "@/hooks/use-api-query";

export function useCreateTradingAccount() {
  return useMutation({
    mutationFn: createTradingAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradingAccount"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error?.message || "Trading account creation failed"
          : "Trading Account creation failed",
      );
    },
  });
}
export const useCurrentUserAccount = () =>
  useApiQuery(["currentUserAccount"], getCurrentUserAccount);
