import { useParams, Link } from "react-router-dom";
import { MarketCard } from "@/components/MarketCard";
import { getCategory, getSubcategories, getMarkets } from "@/lib/mockData";
import { ChevronRight, ArrowLeft } from "lucide-react";

const CategoryPage = () => {
  const { categoryId, subcategoryId } = useParams();
  const category = getCategory(categoryId || "");
  const subcategories = getSubcategories(categoryId || "");
  const markets = getMarkets(categoryId || "", subcategoryId);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Link to="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const currentSubcategory = subcategories.find((s) => s.id === subcategoryId);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Markets
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {subcategoryId ? (
              <>
                <Link
                  to={`/category/${categoryId}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {category.name}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  {currentSubcategory?.name}
                </span>
              </>
            ) : (
              <span className="text-foreground">{category.name}</span>
            )}
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl">{category.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">
              {currentSubcategory?.name || category.name}
            </h1>
            <p className="text-muted-foreground">{category.description}</p>
          </div>
        </div>
      </section>

      {/* Subcategories (if no subcategory selected) */}
      {!subcategoryId && subcategories.length > 0 && (
        <section className="container mx-auto px-4 pb-8">
          <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
          <div className="flex flex-wrap gap-3">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/category/${categoryId}/${sub.id}`}
                className="glass-card px-4 py-2 hover:border-primary/50 transition-all flex items-center gap-2 group"
              >
                <span>{sub.name}</span>
                <span className="text-xs text-muted-foreground">
                  {sub.marketCount}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to category */}
      {subcategoryId && (
        <section className="container mx-auto px-4 pb-4">
          <Link
            to={`/category/${categoryId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All {category.name}
          </Link>
        </section>
      )}

      {/* Markets */}
      <section className="container mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold mb-4">{markets.length} Markets</h2>
        {markets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">
              No markets in this category yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;
