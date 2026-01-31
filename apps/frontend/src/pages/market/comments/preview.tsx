import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TCommentSchema } from "@/schemas/market/schema";

interface CommentPreviewProps {
  comments: TCommentSchema[];
  onShowMore: () => void;
  maxPreview?: number;
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
  comments,
  onShowMore,
  maxPreview = 3,
}: CommentPreviewProps) => {
  const previewComments = comments.slice(0, maxPreview);
  const hasMore = comments.length > maxPreview;

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
        <ScrollArea className="max-h-[180px]">
          <div className="space-y-3 pr-2">
            {previewComments.map((comment, i) => (
              <div
                key={i}
                className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bet-positive to-bet-positive/60 flex items-center justify-center text-bet-positive-foreground text-sm font-semibold flex-shrink-0">
                  {comment?.account?.user?.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">
                      {comment?.account?.user?.name || "Anonymous"}
                    </span>
                    {/*{comment.position && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          comment.position === "yes"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {comment.position.toUpperCase()}
                      </span>
                    )}*/}
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                      {formatTimeAgo(new Date(comment?.createdAt))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {comment?.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
            onClick={onShowMore}
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            Show more comments ({comments.length - maxPreview} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
