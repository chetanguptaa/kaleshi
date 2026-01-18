import { useMutation } from "@tanstack/react-query";
import { createOrder } from "./api";
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
