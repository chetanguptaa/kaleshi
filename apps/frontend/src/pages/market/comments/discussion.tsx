import { useState, useRef, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, ArrowUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Comment } from "./preview";

interface FullCommentsSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  isLoading?: boolean;
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

export const FullCommentsSection = forwardRef<
  HTMLDivElement,
  FullCommentsSectionProps
>(({ comments, onAddComment, isLoading = false }, ref) => {
  const [newComment, setNewComment] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment("");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={ref} className="w-full">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Discussion
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              {comments.length} comments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none text-sm bg-background/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || isLoading}
              className="h-[60px] w-[60px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Comments List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                      {comment.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {comment.user.name}
                      </span>
                      {comment.position && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            comment.position === "yes"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          Holding {comment.position.toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg animate-in fade-in zoom-in duration-200"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

FullCommentsSection.displayName = "FullCommentsSection";
