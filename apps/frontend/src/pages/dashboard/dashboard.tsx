import RootLayout from "@/layout/rootLayout";
import { BACKEND_URL } from "@/constants";
import Loading from "@/components/loading";
import { useMarketCategories, useMarkets } from "@/schemas/dashboard/hooks";
import { toast } from "sonner";
import { useState } from "react";
import { TMarketSelection } from "@/schemas/dashboard/schema";
import { MarketCategoryTabs } from "./market-category-tabs";
import Header from "@/components/header/header";

export default function DashboardPage() {
  const [selection, setSelection] = useState<TMarketSelection>({
    type: "filter",
    value: "trending",
  });
  const marketCategories = useMarketCategories();
  const markets = useMarkets(selection);
  if (marketCategories.isError || markets.isError) {
    toast("Some error occoured, please try again later");
    return;
  }
  if (marketCategories.isLoading || markets.isLoading) {
    return <Loading />;
  }
  return (
    <RootLayout isPrivate={false}>
      <div className="min-h-screen bg-background">
        <Header selectedTab="Dashboard" />
        <div className="px-4 md:px-6  w-[90%] mx-auto">
          <div className="flex gap-6 overflow-x-auto">
            <MarketCategoryTabs
              marketCategories={marketCategories.data.marketCategories}
              selection={selection}
              onSelect={setSelection}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button className="py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium whitespace-nowrap">
                For you
              </button>
              {markets.data.markets.map((mc) => (
                <button
                  key={mc.id}
                  className="px-3 py-1 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mc.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="border-t border-border/50 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2025 Kaleshi. Trade responsibly.</p>
          </div>
        </footer>
      </div>
    </RootLayout>
  );
}
