import { useMutation } from "@tanstack/react-query";
import { login } from "./api";
import { queryClient } from "@/query/query-client";
import { toast } from "sonner";

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error?.message || "Login Failed"
          : "Login failed",
      );
    },
  });
}
