import { cn } from "@/lib/utils";
import { MouseEvent } from "react";

interface OutcomeButtonProps {
  name: string;
  price: number;
  color: string;
  potentialWin: number;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const OutcomeButton = ({
  name,
  price,
  color,
  potentialWin,
  onClick,
}: OutcomeButtonProps) => {
  const priceInCents = price;
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        style={{ backgroundColor: `${color}` }}
        className={`px-8 py-3 rounded-md font-semibold text-base transition-all duration-200 min-w-[160px] flex items-center justify-center gap-2
          hover:opacity-90`}
      >
        <span>{name}</span>
        <span className="font-bold">
          {priceInCents === 0 ? "-" : priceInCents}¢
        </span>
      </button>
      <div className="text-sm">
        <span className="text-muted-foreground">$100</span>
        <span className="text-muted-foreground"> → </span>
        <span className={cn("font-semibold", "text-foreground")}>
          ${potentialWin}
        </span>
      </div>
    </div>
  );
};

export default OutcomeButton;
