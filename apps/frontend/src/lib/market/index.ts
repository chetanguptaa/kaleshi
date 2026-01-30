import { TCommentSchema } from "@/schemas/dashboard/schema";

export interface IOutcome {
  outcomeId: string;
  outcomeName: string;
  outcomeColor: string;
  totalVolume: number;
  fairPrice?: number;
}

export type MarketDataSocketEvent = {
  type: "market.data";
  marketId: number;
  timestamp: number;
  data: {
    outcomeId: string;
    fairPrice: number | null;
    totalVolume: number;
  }[];
};

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
    if (!mostUpvotedComment) {
      mostUpvotedComment = comment;
      continue;
    }
    if (comment._count.votes > mostUpvotedComment._count.votes) {
      mostUpvotedComment = comment;
    }
  }
  return mostUpvotedComment;
}

export const calculatePotentialWin = (price?: number) => {
  if (!price || price <= 0) return 0;
  return Math.round(10000 / price);
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
