import {
  TMarketCategory,
  TMarketSelection,
  TMarketSelectionCategory,
  TMarketSelectionFilter,
} from "@/schemas/dashboard/schema";

type MarketFilter = {
  id: string;
  label: string;
};

export type MarketTab = {
  key: string;
  label: string;
  selection: TMarketSelection;
  isActive: boolean;
};

export const MARKET_FILTERS: MarketFilter[] = [
  { id: "trending", label: "Trending" },
  { id: "new", label: "New" },
  { id: "all", label: "All" },
];

export function buildMarketTabs(
  selection: TMarketSelection,
  categories: TMarketCategory[],
) {
  return [
    ...MARKET_FILTERS.map((f) => ({
      key: f.id,
      label: f.label,
      selection: { type: "filter", value: f.id } as TMarketSelectionFilter,
      isActive: selection.type === "filter" && selection.value === f.id,
    })),
    ...categories.map((mc) => ({
      key: mc.id,
      label: mc.name,
      selection: {
        type: "category",
        categoryId: mc.id,
      } as TMarketSelectionCategory,
      isActive: selection.type === "category" && selection.categoryId === mc.id,
    })),
  ];
}
