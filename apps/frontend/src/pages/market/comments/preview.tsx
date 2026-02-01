import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, MessageCircle, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TCommentSchema } from "@/schemas/market/schema";
import { useEffect, useRef, useState } from "react";
import { EOrderType } from "@/schemas/orders/schema";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { IOutcome, timeAgo } from "@/lib/market";
import { useCreateComment, useVoteComment } from "@/schemas/comment/hooks";
import { CommentVoteType, TVoteCommentRequest } from "@/schemas/comment/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommentPreviewProps {
  marketId: number;
  comments: TCommentSchema[];
  orderType: EOrderType;
  isLoggedIn: boolean;
  hasTradingAccount: boolean;
  selectedOutcome: IOutcome;
  onShowMore: () => void;
}

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const CommentPreview = ({
  marketId,
  comments,
  orderType,
  isLoggedIn,
  hasTradingAccount,
  selectedOutcome,
  onShowMore,
}: CommentPreviewProps) => {
  const [commentText, setCommentText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { mutate } = useCreateComment();
  const { mutate: voteCommentMutate } = useVoteComment();

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [comments, orderType]);

  const handleSubmit = async () => {
    if (!isLoggedIn || !hasTradingAccount) return;
    if (!commentText || !commentText.length) return;
    mutate({
      marketId,
      data: {
        comment: commentText,
      },
    });
    setCommentText("");
    setIsComposing(false);
  };

  const handleVote = async (commentId: string, data: TVoteCommentRequest) => {
    if (!isLoggedIn || !hasTradingAccount) return;
    voteCommentMutate({
      marketId,
      commentId,
      data,
    });
  };

  const canVote = isLoggedIn && hasTradingAccount;

  const voteTooltipMessage = !isLoggedIn
    ? "Login to vote"
    : !hasTradingAccount
      ? "Create trading account to vote"
      : "";

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Live Discussion
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {comments.length} comments
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <ScrollArea
          style={{
            maxHeight: orderType === EOrderType.LIMIT ? "70px" : "180px",
          }}
          className="overflow-y-auto"
        >
          <div className="space-y-3 pr-2">
            {comments?.map((comment) => {
              const upvotes = comment?.votes?.filter(
                (v) => v.vote === "UP",
              ).length;
              const downvotes = comment?.votes?.filter(
                (v) => v.vote === "DOWN",
              ).length;
              const isNegative = downvotes > upvotes;
              const voteStyle = isNegative
                ? "text-red-400"
                : "text-emerald-400";
              return (
                <div
                  key={comment.id}
                  className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bet-positive to-bet-positive/60 flex items-center justify-center text-bet-positive-foreground text-sm font-semibold flex-shrink-0">
                    {comment.account.user.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-xs">
                        {comment?.account?.user?.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {timeAgo(new Date(comment?.createdAt))}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-2 mt-0.5  ${voteStyle}`}>
                      {comment.comment}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${canVote ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                          >
                            <div
                              role="button"
                              aria-disabled={!canVote}
                              className={`flex items-center gap-1 justify-center select-none ${canVote ? "cursor-pointer" : "cursor-not-allowed opacity-100"}`}
                              onClick={() => {
                                if (!canVote) return;
                                handleVote(comment.id, {
                                  vote: CommentVoteType.UP,
                                });
                              }}
                            >
                              <ArrowUp className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">
                                {upvotes}
                              </span>
                            </div>
                            <div
                              role="button"
                              aria-disabled={!canVote}
                              className={`flex items-center gap-1 justify-center select-none ${canVote ? "cursor-pointer" : "cursor-not-allowed opacity-100"}`}
                              onClick={() => {
                                if (!canVote) return;
                                handleVote(comment.id, {
                                  vote: CommentVoteType.DOWN,
                                });
                              }}
                            >
                              <ArrowDown className="w-3 h-3 text-red-400" />
                              <span className="text-red-400">{downvotes}</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        {!canVote && (
                          <TooltipContent side="top">
                            <p>{voteTooltipMessage}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <div className="pt-3 border-t border-border">
          {!isLoggedIn && (
            <Button
              className="w-full"
              style={{
                backgroundColor: selectedOutcome?.outcomeColor || "default",
                color:
                  selectedOutcome?.outcomeColor === "default"
                    ? "black"
                    : "white",
              }}
              asChild
            >
              <Link to="/auth/login">Login to comment</Link>
            </Button>
          )}
          {isLoggedIn && !hasTradingAccount && (
            <Button
              className="w-full"
              style={{
                backgroundColor: selectedOutcome?.outcomeColor || "default",
                color:
                  selectedOutcome?.outcomeColor === "default"
                    ? "black"
                    : "white",
              }}
              asChild
            >
              <Link to="/trading-account">
                Create trading account to comment
              </Link>
            </Button>
          )}
          {isLoggedIn && hasTradingAccount && (
            <div className="mt-2">
              {!isComposing ? (
                <div
                  onClick={() => setIsComposing(true)}
                  className="flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-2 py-1 hover:bg-muted/50 cursor-pointer"
                >
                  <span className="flex-1">Add a comment…</span>
                  <Send className="w-3 h-3 opacity-60" />
                </div>
              ) : (
                <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-background cursor-text">
                  <input
                    autoFocus
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-transparent text-xs outline-none"
                    placeholder="Write your comment…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit();
                        setIsComposing(false);
                      }
                      if (e.key === "Escape") setIsComposing(false);
                    }}
                  />

                  <button
                    onClick={() => {
                      handleSubmit();
                      setIsComposing(false);
                    }}
                    disabled={!commentText.trim()}
                  >
                    <Send className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
