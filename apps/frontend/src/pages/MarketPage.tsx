import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { OutcomeCard } from '@/components/OutcomeCard';
import { OrderBook } from '@/components/OrderBook';
import { TradeModal } from '@/components/TradeModal';
import { getMarket, generateOrderBook, getCategory, Outcome } from '@/lib/mockData';
import { ChevronRight, Clock, BarChart3, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MarketPage = () => {
  const { marketId } = useParams();
  const market = getMarket(marketId || '');
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [activeOutcomeId, setActiveOutcomeId] = useState<string | null>(null);
  
  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Market not found</h1>
          <Link to="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }
  
  const category = getCategory(market.categoryId);
  const orderBook = generateOrderBook(activeOutcomeId || market.outcomes[0]?.id || '');
  
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };
  
  const handleTrade = (outcome: Outcome, side: 'buy' | 'sell') => {
    setSelectedOutcome(outcome);
    setTradeSide(side);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Markets
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {category && (
              <>
                <Link 
                  to={`/category/${category.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {category.name}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            <span className="text-foreground truncate max-w-[200px]">{market.title}</span>
          </nav>
        </div>
      </div>
      
      {/* Market Header */}
      <section className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{market.title}</h1>
        <p className="text-muted-foreground mb-6">{market.description}</p>
        
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expires {formatDistanceToNow(new Date(market.expiresAt), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Volume: <span className="text-accent font-medium">{formatVolume(market.volume)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{Math.floor(Math.random() * 1000) + 100} traders</span>
          </div>
        </div>
      </section>
      
      {/* Outcomes & Order Book */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Outcomes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Outcomes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {market.outcomes.map((outcome) => (
                <div 
                  key={outcome.id}
                  onClick={() => setActiveOutcomeId(outcome.id)}
                  className={`cursor-pointer transition-all ${
                    activeOutcomeId === outcome.id ? 'ring-2 ring-primary rounded-lg' : ''
                  }`}
                >
                  <OutcomeCard
                    outcome={outcome}
                    onBuy={() => handleTrade(outcome, 'buy')}
                    onSell={() => handleTrade(outcome, 'sell')}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Book */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Order Book
              {activeOutcomeId && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({market.outcomes.find(o => o.id === activeOutcomeId)?.name || 'Select outcome'})
                </span>
              )}
            </h2>
            <OrderBook orderBook={orderBook} />
          </div>
        </div>
      </section>
      
      {/* Trade Modal */}
      {selectedOutcome && (
        <TradeModal
          outcome={selectedOutcome}
          side={tradeSide}
          onClose={() => setSelectedOutcome(null)}
        />
      )}
    </div>
  );
};

export default MarketPage;
