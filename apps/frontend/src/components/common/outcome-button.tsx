import { cn } from "@/lib/utils";

interface OutcomeButtonProps {
  name: string;
  price: number;
  potentialWin: number;
  variant: "positive" | "negative";
  onClick?: () => void;
}

const OutcomeButton = ({
  name,
  price,
  potentialWin,
  variant,
  onClick,
}: OutcomeButtonProps) => {
  const priceInCents = Math.round(price * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          "px-8 py-3 rounded-md font-semibold text-base transition-all duration-200 min-w-[160px]",
          "flex items-center justify-center gap-2",
          variant === "positive"
            ? "bg-bet-positive text-bet-positive-foreground hover:opacity-90"
            : "bg-bet-negative text-bet-negative-foreground hover:opacity-90",
        )}
      >
        <span>{name}</span>
        <span className="font-bold">
          {priceInCents === 0 ? "-" : priceInCents}¢
        </span>
      </button>
      <div className="text-sm">
        <span className="text-muted-foreground">$100</span>
        <span className="text-muted-foreground"> → </span>
        <span
          className={cn(
            "font-semibold",
            variant === "positive" ? "text-chart-positive" : "text-foreground",
          )}
        >
          ${potentialWin}
        </span>
      </div>
    </div>
  );
};

export default OutcomeButton;
