import { useMutation } from "@tanstack/react-query";
import { canSellOrder, createOrder } from "./api";
import { queryClient } from "@/query/query-client";
import { toast } from "sonner";

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["createOrder"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error?.message || "Order creation Failed"
          : "Order creation failed",
      );
    },
  });
}

export function useCanSellOrder() {
  return useMutation({
    mutationFn: canSellOrder,
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: [""] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error?.message || "can sell order check Failed"
          : "can sell order check failed",
      );
    },
  });
}
