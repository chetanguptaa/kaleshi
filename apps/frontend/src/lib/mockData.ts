export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  marketCount: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  marketCount: number;
}

export interface Market {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  title: string;
  description: string;
  expiresAt: string;
  volume: number;
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  marketId: string;
  name: string;
  probability: number;
  lastPrice: number;
  change24h: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  outcomeId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export const categories: Category[] = [
  { id: 'sports', name: 'Sports', icon: '⚽', description: 'Trade on sports outcomes', marketCount: 156 },
  { id: 'politics', name: 'Politics', icon: '🏛️', description: 'Elections and policy events', marketCount: 89 },
  { id: 'crypto', name: 'Crypto', icon: '₿', description: 'Cryptocurrency predictions', marketCount: 67 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Movies, TV, and awards', marketCount: 45 },
  { id: 'economics', name: 'Economics', icon: '📈', description: 'Economic indicators', marketCount: 34 },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Scientific discoveries', marketCount: 23 },
];

export const subcategories: Subcategory[] = [
  { id: 'euro-football', categoryId: 'sports', name: 'European Football', marketCount: 45 },
  { id: 'nba', categoryId: 'sports', name: 'NBA', marketCount: 32 },
  { id: 'nfl', categoryId: 'sports', name: 'NFL', marketCount: 28 },
  { id: 'tennis', categoryId: 'sports', name: 'Tennis', marketCount: 21 },
  { id: 'us-elections', categoryId: 'politics', name: 'US Elections', marketCount: 34 },
  { id: 'eu-politics', categoryId: 'politics', name: 'EU Politics', marketCount: 22 },
  { id: 'bitcoin', categoryId: 'crypto', name: 'Bitcoin', marketCount: 28 },
  { id: 'ethereum', categoryId: 'crypto', name: 'Ethereum', marketCount: 19 },
];

export const markets: Market[] = [
  {
    id: 'rm-barca-2025',
    categoryId: 'sports',
    subcategoryId: 'euro-football',
    title: 'Real Madrid vs Barcelona - El Clasico',
    description: 'La Liga match on March 15, 2025',
    expiresAt: '2025-03-15T20:00:00Z',
    volume: 2450000,
    outcomes: [
      { id: 'rm-win', marketId: 'rm-barca-2025', name: 'Real Madrid', probability: 42, lastPrice: 0.42, change24h: 2.3 },
      { id: 'barca-win', marketId: 'rm-barca-2025', name: 'Barcelona', probability: 35, lastPrice: 0.35, change24h: -1.5 },
      { id: 'draw', marketId: 'rm-barca-2025', name: 'Draw', probability: 23, lastPrice: 0.23, change24h: -0.8 },
    ],
  },
  {
    id: 'champions-league-final',
    categoryId: 'sports',
    subcategoryId: 'euro-football',
    title: 'Champions League Winner 2025',
    description: 'Who will win the UEFA Champions League?',
    expiresAt: '2025-06-01T20:00:00Z',
    volume: 8900000,
    outcomes: [
      { id: 'man-city', marketId: 'champions-league-final', name: 'Manchester City', probability: 28, lastPrice: 0.28, change24h: 1.2 },
      { id: 'real-madrid', marketId: 'champions-league-final', name: 'Real Madrid', probability: 24, lastPrice: 0.24, change24h: 0.5 },
      { id: 'bayern', marketId: 'champions-league-final', name: 'Bayern Munich', probability: 18, lastPrice: 0.18, change24h: -0.8 },
      { id: 'psg', marketId: 'champions-league-final', name: 'PSG', probability: 15, lastPrice: 0.15, change24h: 2.1 },
    ],
  },
  {
    id: 'btc-100k',
    categoryId: 'crypto',
    subcategoryId: 'bitcoin',
    title: 'Bitcoin above $100K by EOY 2025',
    description: 'Will BTC close above $100,000 on Dec 31, 2025?',
    expiresAt: '2025-12-31T23:59:59Z',
    volume: 15600000,
    outcomes: [
      { id: 'btc-yes', marketId: 'btc-100k', name: 'Yes', probability: 67, lastPrice: 0.67, change24h: 3.4 },
      { id: 'btc-no', marketId: 'btc-100k', name: 'No', probability: 33, lastPrice: 0.33, change24h: -3.4 },
    ],
  },
  {
    id: 'fed-rate-cut',
    categoryId: 'economics',
    title: 'Fed Rate Cut in Q1 2025',
    description: 'Will the Federal Reserve cut rates in Q1 2025?',
    expiresAt: '2025-03-31T23:59:59Z',
    volume: 4200000,
    outcomes: [
      { id: 'fed-yes', marketId: 'fed-rate-cut', name: 'Yes', probability: 45, lastPrice: 0.45, change24h: -2.1 },
      { id: 'fed-no', marketId: 'fed-rate-cut', name: 'No', probability: 55, lastPrice: 0.55, change24h: 2.1 },
    ],
  },
  {
    id: 'lakers-championship',
    categoryId: 'sports',
    subcategoryId: 'nba',
    title: 'Lakers NBA Championship 2025',
    description: 'Will the Lakers win the 2025 NBA Championship?',
    expiresAt: '2025-06-15T23:59:59Z',
    volume: 3100000,
    outcomes: [
      { id: 'lakers-yes', marketId: 'lakers-championship', name: 'Yes', probability: 12, lastPrice: 0.12, change24h: 0.8 },
      { id: 'lakers-no', marketId: 'lakers-championship', name: 'No', probability: 88, lastPrice: 0.88, change24h: -0.8 },
    ],
  },
];

export const generateOrderBook = (outcomeId: string): OrderBook => {
  const outcome = markets.flatMap(m => m.outcomes).find(o => o.id === outcomeId);
  const basePrice = outcome?.lastPrice || 0.5;
  
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  let bidTotal = 0;
  let askTotal = 0;
  
  for (let i = 0; i < 8; i++) {
    const bidQty = Math.floor(Math.random() * 5000) + 500;
    const askQty = Math.floor(Math.random() * 5000) + 500;
    bidTotal += bidQty;
    askTotal += askQty;
    
    bids.push({
      price: Math.max(0.01, basePrice - (i + 1) * 0.01),
      quantity: bidQty,
      total: bidTotal,
    });
    
    asks.push({
      price: Math.min(0.99, basePrice + (i + 1) * 0.01),
      quantity: askQty,
      total: askTotal,
    });
  }
  
  return { outcomeId, bids, asks };
};

export const getCategory = (id: string) => categories.find(c => c.id === id);
export const getSubcategories = (categoryId: string) => subcategories.filter(s => s.categoryId === categoryId);
export const getMarkets = (categoryId: string, subcategoryId?: string) => {
  return markets.filter(m => {
    if (subcategoryId) return m.subcategoryId === subcategoryId;
    return m.categoryId === categoryId;
  });
};
export const getMarket = (id: string) => markets.find(m => m.id === id);
