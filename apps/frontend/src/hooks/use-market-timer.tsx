import { useEffect, useState } from "react";

export function useMarketTimer(startsAt: string, endsAt: string): string {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!startsAt || !endsAt) return;

    const update = () => {
      const now = new Date();
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);

      let label: "Begins in" | "Ends in" | "Ended";
      let targetDate: Date;

      if (now < startDate) {
        label = "Begins in";
        targetDate = startDate;
      } else if (now < endDate) {
        label = "Ends in";
        targetDate = endDate;
      } else {
        label = "Ended";
        targetDate = endDate;
      }

      let diffMs = targetDate.getTime() - now.getTime();
      if (diffMs < 0) diffMs = 0;

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formattedDate = targetDate.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (label === "Ended") {
        setDisplay(`Ended | ${formattedDate}`);
      } else {
        setDisplay(
          `${label} ${hours}h ${minutes}m ${seconds}s | ${formattedDate}`,
        );
      }
    };

    update(); // run immediately
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [startsAt, endsAt]);

  return display;
}
