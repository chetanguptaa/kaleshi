import { TCommentSchema } from "@/schemas/dashboard/schema";

export interface IOutcome {
  outcome_id: string;
  outcome_name: string;
  total_volume: number;
  total_notional: number;
  prices: number[];
  ticker: string;
}

export function timeAgo(createdAt: Date | string): string {
  const createdTime =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const seconds = Math.floor((Date.now() - createdTime.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} Min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} Day${days > 1 ? "s" : ""} Ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} Week${weeks > 1 ? "s" : ""} Ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} Month${months > 1 ? "s" : ""} Ago`;
  const years = Math.floor(days / 365);
  return `${years} Year${years > 1 ? "s" : ""} Ago`;
}

export function getMostUpvotedComment(comments: TCommentSchema[]) {
  if (!comments.length) return null;
  let mostUpvotedComment: TCommentSchema | null = null;
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment._count.votes > mostUpvotedComment._count.votes) {
      mostUpvotedComment = comment;
    }
  }
  return mostUpvotedComment;
}
