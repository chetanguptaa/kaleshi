import { useMarketsPrefetch } from "@/schemas/dashboard/hooks";
import {
  TMarketCategory,
  TMarketSelection,
  TMarketSelectionCategory,
} from "@/schemas/dashboard/schema";
import { Dispatch, SetStateAction } from "react";
import { buildMarketTabs } from "./build-tabs";
import { SetterOrUpdater } from "recoil";

export function MarketCategoryTabs({
  marketCategories,
  selection,
  onSelect,
  setSubSelection,
}: {
  marketCategories: TMarketCategory[];
  selection: TMarketSelection;
  onSelect: Dispatch<SetStateAction<TMarketSelection>>;
  setSubSelection: SetterOrUpdater<TMarketSelectionCategory>;
}) {
  const prefetch = useMarketsPrefetch();
  const tabs = buildMarketTabs(selection, marketCategories);

  return (
    <div className="flex gap-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => {
            setSubSelection(null);
            onSelect(tab.selection);
          }}
          onMouseEnter={() => prefetch(tab.selection)}
          className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            tab.isActive
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
