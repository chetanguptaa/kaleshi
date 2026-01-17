import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { useMarketById, useMarketSocket } from "@/schemas/dashboard/hooks";
import { CoinsIcon, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface IComment {
  account: {
    user: {
      name: string;
    };
  };
  comment: string;
  createdAt: string;
  _count: {
    votes: number;
  };
  votes: {
    id: string;
    vote: "UP" | "DOWN";
  }[];
}

interface IOutcome {
  outcome_id: string;
  outcome_name: string;
  total_volume: number;
  total_notional: number;
  price: number;
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

const getMostUpvotedComment = (comments: IComment[]) => {
  if (!comments.length) return null;
  let mostUpvotedComment: IComment | null = null;
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment._count.votes > mostUpvotedComment._count.votes) {
      mostUpvotedComment = comment;
    }
  }
  return mostUpvotedComment;
};

const TrendingMarketCard = ({ id }: { id: number }) => {
  const trendingMarket = useMarketById(id);
  const marketSocket = useMarketSocket(id);

  const [outcomesWS, setOutcomesWS] = useState<IOutcome[] | null>(null);
  const [totalVolume, setTotalVolume] = useState(null);
  const [totalNotional, setTotalNotional] = useState(null);

  useEffect(() => {
    if (!outcomesWS) return;
    let tv = 0;
    let tn = 0;
    for (let i = 0; i < outcomesWS.length; i++) {
      tv += outcomesWS[i].total_volume;
      tn += outcomesWS[i].total_notional;
    }
    setTotalNotional(tn);
    setTotalVolume(tv);
  }, [outcomesWS]);

  useSocketEvent<{
    market_id: number;
    outcomes: IOutcome[];
    timestamp: number;
  }>("marketUpdate", (payload) => {
    if (payload.market_id !== id) return;
    setOutcomesWS(payload.outcomes);
  });

  if (trendingMarket.isLoading || marketSocket.isSocketLoading) {
    return <Loading />;
  }

  let mostUpvotedComment = getMostUpvotedComment(
    trendingMarket.data.market.comments,
  );

  if (trendingMarket.isSuccess) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mt-1">
                  {trendingMarket.data.market.name}
                </h2>
              </div>
            </div>
            <div className="flex gap-3">
              {outcomesWS
                ? outcomesWS.map((o) => (
                    <Button key={o.ticker} variant="outline">
                      {o.outcome_name}
                    </Button>
                  ))
                : trendingMarket.data.market.outcomes.map((o) => (
                    <Button key={o.ticker} variant="outline">
                      {o.name} {0.1}
                    </Button>
                  ))}
            </div>
            <div className="space-y-3">
              {mostUpvotedComment && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bet-positive to-bet-positive/60 flex items-center justify-center text-bet-positive-foreground text-sm font-semibold flex-shrink-0">
                    {mostUpvotedComment.account.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {mostUpvotedComment.account.user.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {timeAgo(mostUpvotedComment.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {mostUpvotedComment.comment}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex justify-center items-center gap-2 text-green-500">
                  <CoinsIcon />
                  <span className="text-muted-foreground text-sm">
                    Total Volume: {totalVolume ?? 0}
                  </span>
                </div>
                {mostUpvotedComment && (
                  <Link
                    to="/abc"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>More comments</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default TrendingMarketCard;
