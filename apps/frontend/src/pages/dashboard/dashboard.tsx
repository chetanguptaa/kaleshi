import RootLayout from "@/layout/rootLayout";
import Loading from "@/components/loading";
import {
  useMarketCategories,
  useMarketCategoryById,
  useMarkets,
  useMarketsPrefetch,
} from "@/schemas/dashboard/hooks";
import { MarketCategoryTabs } from "./components/market-category-tabs";
import Header from "@/components/header/header";
import { MarketCard } from "@/components/MarketCard";
import { useRecoilState } from "recoil";
import marketSelectionAtom from "@/store/atoms/dashboard/marketSelectionAtom";
import marketSubSelectionAtom from "@/store/atoms/dashboard/marketSubSelectionAtom";
import TrendingMarketCard from "./components/trending-market-card";
import { useCurrentUser } from "@/schemas/layout/hooks";

export default function DashboardPage() {
  const [selection, setSelection] = useRecoilState(marketSelectionAtom);
  const [subSelection, setSubSelection] = useRecoilState(
    marketSubSelectionAtom,
  );
  const currentUser = useCurrentUser();

  let categoryId: number | undefined;
  if (subSelection) {
    categoryId = subSelection.categoryId;
  } else if (selection.type === "category") {
    categoryId = selection.categoryId;
  }

  const marketCategories = useMarketCategories();
  const markets = useMarkets(selection);
  const marketCategoryById = useMarketCategoryById(categoryId);
  const prefetch = useMarketsPrefetch();

  if (
    marketCategories.isLoading ||
    markets.isLoading ||
    marketCategoryById.isLoading ||
    currentUser.isLoading
  ) {
    return <Loading />;
  }

  const trendingMarket = markets.data.markets.length
    ? markets.data.markets[0]
    : null;

  if (marketCategories.isSuccess) {
    return (
      <RootLayout isPrivate={false} currentUser={currentUser.data || null}>
        <div className="bg-background h-screen flex flex-col">
          <Header
            selectedTab="Dashboard"
            currentUser={currentUser.data?.user || null}
          />
          <div className="px-4 md:px-6 w-[90%] mx-auto shrink-0">
            <div className="flex gap-6 overflow-x-auto">
              <MarketCategoryTabs
                marketCategories={marketCategories.data.marketCategories}
                selection={selection}
                onSelect={setSelection}
                setSubSelection={setSubSelection}
              />
            </div>
          </div>
          <div className="p-2 w-[90%]  px-4 md:px-6  mx-auto md:p-3 pb-0 shrink-0">
            <div className="flex gap-2 overflow-x-auto max-w-7xl mx-auto">
              {/*TODO: Implement for you page*/}
              <button
                onClick={() => setSubSelection(null)}
                className={
                  subSelection
                    ? "px-3 py-1 text-sm whitespace-nowrap text-black hover:text-foreground transition-colors border rounded-2xl border-gray-400 hover:bg-slate-100"
                    : "px-3 py-1 text-sm whitespace-nowrap transition-colors border rounded-2xl  hover:bg-green-200 bg-green-50 text-green-700"
                }
              >
                For you
              </button>
              {selection.type === "category" &&
                marketCategories.data.marketCategories
                  .find((mc) => mc.id === selection.categoryId)
                  .children.map((child: any) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSubSelection({
                          type: "category",
                          categoryId: child.id,
                        });
                      }}
                      onMouseEnter={() =>
                        prefetch({
                          type: "category",
                          categoryId: child.id,
                        })
                      }
                      className={
                        !subSelection
                          ? "px-3 py-1 text-sm whitespace-nowrap text-black hover:text-foreground transition-colors border rounded-2xl border-gray-400 hover:bg-slate-100"
                          : "px-3 py-1 text-sm whitespace-nowrap transition-colors border rounded-2xl  hover:bg-green-200 bg-green-50 text-green-700"
                      }
                    >
                      {child.name}
                    </button>
                  ))}
            </div>
          </div>
          <div className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto w-[90%] p-2 md:p-3 px-4 md:px-6  mx-auto">
            {trendingMarket && <TrendingMarketCard id={trendingMarket.id} />}
            <section className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                {markets.data.markets.slice(1).map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            </section>
          </div>
          <footer className="border-t border-border/50 py-8 fixed bottom-0 w-full bg-background">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© 2025 Kaleshi. Trade responsibly.</p>
            </div>
          </footer>
        </div>
      </RootLayout>
    );
  }
}
