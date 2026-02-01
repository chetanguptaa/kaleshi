import { z } from "zod";

export const createCommentRequestSchema = z
  .object({
    comment: z.string().min(1),
  })
  .loose();

export const createCommentResponseSchema = z
  .object({
    success: z.boolean(),
    id: z.uuid(),
  })
  .loose();

export const CommentVoteType = {
  UP: "UP",
  DOWN: "DOWN",
};

export const voteCommentRequestSchema = z
  .object({
    vote: z.enum([CommentVoteType.UP, CommentVoteType.DOWN]),
  })
  .loose();

export const voteCommentResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .loose();

export type TCreateCommentRequest = z.infer<typeof createCommentRequestSchema>;
export type TCreateCommentResponse = z.infer<
  typeof createCommentResponseSchema
>;
export type TVoteCommentRequest = z.infer<typeof voteCommentRequestSchema>;
export type TVoteCommentResponse = z.infer<typeof voteCommentResponseSchema>;
