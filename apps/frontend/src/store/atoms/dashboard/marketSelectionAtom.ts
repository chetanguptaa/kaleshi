import { TMarketSelection } from "@/schemas/dashboard/schema";
import { atom } from "recoil";

const marketSelectionAtom = atom<TMarketSelection>({
  key: "marketSubSelection",
  default: {
    type: "filter",
    value: "trending",
  },
});

export default marketSelectionAtom;
