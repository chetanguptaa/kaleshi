import { mutate } from "@/api/mutate";
import {
  createCommentRequestSchema,
  TCreateCommentRequest,
  TVoteCommentRequest,
  voteCommentRequestSchema,
  voteCommentResponseSchema,
} from "./schema";
import { createOrderResponseSchema } from "../orders/schema";

export const createComment = (marketId: number, data: TCreateCommentRequest) =>
  mutate({
    config: {
      url: `/market/${marketId}/comment`,
      method: "POST",
      withCredentials: true,
    },
    requestSchema: createCommentRequestSchema,
    responseSchema: createOrderResponseSchema,
    data,
  });

export const voteComment = (
  marketId: number,
  commentId: string,
  data: TVoteCommentRequest,
) =>
  mutate({
    config: {
      url: `/market/${marketId}/comment/${commentId}/vote`,
      method: "POST",
      withCredentials: true,
    },
    requestSchema: voteCommentRequestSchema,
    responseSchema: voteCommentResponseSchema,
    data,
  });
