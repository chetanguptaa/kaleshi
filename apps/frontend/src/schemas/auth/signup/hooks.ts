import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import { signup } from "./api";
import { toast } from "sonner";

export function useSignup() {
  return useMutation({
    mutationFn: signup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error?.message || "Signup Failed"
          : "Signup failed",
      );
    },
  });
}
