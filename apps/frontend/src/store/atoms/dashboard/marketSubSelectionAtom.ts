import { TMarketSelectionCategory } from "@/schemas/dashboard/schema";
import { atom } from "recoil";

const marketSubSelectionAtom = atom<TMarketSelectionCategory | null>({
  key: "marketSelection",
  default: null,
});

export default marketSubSelectionAtom;
