import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { MarketCard } from "@/components/MarketCard";
import { categories, markets } from "@/lib/mockData";
import { BarChart3, Shield, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const trendingMarkets = markets.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Trade on <span className="gradient-text">Real-World</span> Events
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Buy and sell contracts on sports, politics, crypto, and more. Turn your predictions into profit with
              Kaleshi's event markets.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                <span>Instant settlement</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <span>Regulated markets</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <span>Real-time data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Market Categories</h2>
            <p className="text-muted-foreground">Explore events across different domains</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Trending Markets */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold">Trending Markets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Kaleshi. Trade responsibly.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
