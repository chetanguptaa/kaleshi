import { Outcome } from '@/lib/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OutcomeCardProps {
  outcome: Outcome;
  onBuy: () => void;
  onSell: () => void;
}

export function OutcomeCard({ outcome, onBuy, onSell }: OutcomeCardProps) {
  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{outcome.name}</h3>
        <span className={`text-sm flex items-center gap-1 ${
          outcome.change24h >= 0 ? 'text-success' : 'text-destructive'
        }`}>
          {outcome.change24h >= 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {Math.abs(outcome.change24h).toFixed(1)}%
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold font-mono text-primary">
            {outcome.probability}%
          </span>
          <span className="text-sm text-muted-foreground mb-1">probability</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="probability-bar h-full transition-all duration-500"
            style={{ width: `${outcome.probability}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <span>Last price:</span>
        <span className="font-mono font-medium text-foreground">
          ${outcome.lastPrice.toFixed(2)}
        </span>
      </div>
      
      <div className="flex gap-3">
        <Button 
          onClick={onBuy}
          className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
        >
          Buy Yes
        </Button>
        <Button 
          onClick={onSell}
          variant="destructive"
          className="flex-1"
        >
          Buy No
        </Button>
      </div>
    </div>
  );
}
