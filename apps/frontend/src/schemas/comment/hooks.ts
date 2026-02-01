import { useMutation } from "@tanstack/react-query";
import { createComment, voteComment } from "./api";
import { toast } from "sonner";
import { TCreateCommentRequest, TVoteCommentRequest } from "./schema";

type CreateCommentVariables = {
  marketId: number;
  data: TCreateCommentRequest;
};

export function useCreateComment() {
  return useMutation({
    mutationFn: ({ marketId, data }: CreateCommentVariables) => {
      return createComment(marketId, data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message || "Comment creation failed"
          : "Comment creation failed",
      );
    },
  });
}

type VoteCommentVariables = {
  marketId: number;
  commentId: string;
  data: TVoteCommentRequest;
};

export function useVoteComment() {
  return useMutation({
    mutationFn: ({ marketId, commentId, data }: VoteCommentVariables) => {
      return voteComment(marketId, commentId, data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message || "Vote failed" : "Vote failed",
      );
    },
  });
}
