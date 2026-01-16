import { markets } from "@/lib/mockData";
import DashboardLayout from "./layout";
import DashboardHeader from "./header";

export default function DashboardPage() {
  const trendingMarkets = markets.slice(0, 4);
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Category Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium whitespace-nowrap">
                For you
              </button>
              {[
                "Pro Football Playoffs",
                "Jerome Powell",
                "College FB Playoffs",
                "SCOTUS",
                "Iran",
                "Donroe Doctrine",
                "Venezuela",
                "Mayor Mamdani",
                "AFCON",
                "NHL",
              ].map((cat, i) => (
                <button
                  key={i}
                  className="px-3 py-1 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
                >
                  {cat}
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
    </DashboardLayout>
  );
}
