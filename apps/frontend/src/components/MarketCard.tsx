import { Link } from 'react-router-dom';
import { Market } from '@/lib/mockData';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const topOutcome = market.outcomes.reduce((a, b) => 
    a.probability > b.probability ? a : b
  );
  
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };
  
  return (
    <Link to={`/market/${market.id}`}>
      <div className="group glass-card p-5 transition-all duration-300 hover:border-primary/50 hover:glow-primary cursor-pointer animate-slide-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
            {market.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(market.expiresAt), { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {market.description}
        </p>
        
        <div className="space-y-3">
          {market.outcomes.slice(0, 3).map((outcome) => (
            <div key={outcome.id} className="flex items-center justify-between">
              <span className="text-sm">{outcome.name}</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs flex items-center gap-1 ${
                  outcome.change24h >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {outcome.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(outcome.change24h).toFixed(1)}%
                </span>
                <span className="font-mono font-medium text-primary">
                  {outcome.probability}%
                </span>
              </div>
            </div>
          ))}
          {market.outcomes.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{market.outcomes.length - 3} more outcomes
            </p>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Volume</span>
          <span className="text-sm font-medium text-accent">{formatVolume(market.volume)}</span>
        </div>
      </div>
    </Link>
  );
}
