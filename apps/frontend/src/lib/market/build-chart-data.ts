import { formatDate } from ".";

export const buildChartData = (
  historyData: {
    outcomeId: string;
    outcomeName: string;
    history: {
      time: string;
      totalVolume: number;
      fairPrice?: number;
    }[];
  }[],
  outcomeNameById: Record<string, string>,
) => {
  const rowsByTime = new Map<string, any>();
  for (const outcome of historyData) {
    const outcomeName = outcomeNameById[outcome.outcomeId];
    if (!outcomeName) continue;
    for (const point of outcome.history) {
      if (!rowsByTime.has(point.time)) {
        rowsByTime.set(point.time, {
          timestamp: point.time,
          date: formatDate(point.time),
        });
      }
      rowsByTime.get(point.time)[outcomeName.replace(" ", "")] =
        point.fairPrice !== null ? Math.round(point.fairPrice) : null;
    }
  }
  return Array.from(rowsByTime.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
};
