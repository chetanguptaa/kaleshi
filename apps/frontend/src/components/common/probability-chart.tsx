import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: number | string;
}

interface Outcome {
  name: string;
  percentage: number;
  color: "positive" | "negative";
}

interface ProbabilityChartProps {
  data: ChartDataPoint[];
  outcomes: Outcome[];
  currentTimestamp?: string;
}

const ProbabilityChart = ({
  data,
  outcomes,
  currentTimestamp,
}: ProbabilityChartProps) => {
  // Find the index for the reference line
  const referenceIndex = currentTimestamp
    ? data.findIndex((d) => d.date === currentTimestamp)
    : Math.floor(data.length * 0.4);

  return (
    <div className="relative h-[280px] w-full">
      {/* Timestamp header */}
      {/*<div className="absolute top-0 left-1/3 text-sm text-muted-foreground">
        {currentTimestamp || "1/28/2026, 8:46 AM"}
      </div>*/}

      {/* Outcome labels on chart */}
      {/*<div className="absolute top-12 left-1/3 space-y-1 z-10">
        {outcomes.map((outcome) => (
          <div key={outcome.name} className="flex flex-col">
            <span
              className={`text-sm font-medium ${
                outcome.color === "positive"
                  ? "text-chart-positive"
                  : "text-muted-foreground"
              }`}
            >
              {outcome.name}
            </span>
            <span
              className={`text-3xl font-bold ${
                outcome.color === "positive"
                  ? "text-chart-positive"
                  : "text-muted-foreground"
              }`}
            >
              {outcome.percentage}%
            </span>
          </div>
        ))}
      </div>*/}

      {/* Y-axis labels on right */}
      <div className="absolute right-0 top-8 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>

      <ResponsiveContainer width="95%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 40, right: 40, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--chart-positive))"
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--chart-positive))"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--chart-negative))"
                stopOpacity={0.1}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--chart-negative))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            dy={10}
          />

          <YAxis domain={[0, 100]} hide />

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <ReferenceLine
              key={y}
              y={y}
              stroke="hsl(var(--chart-grid))"
              strokeDasharray="3 3"
            />
          ))}

          {/* Vertical reference line for current time */}
          <ReferenceLine
            x={data[referenceIndex]?.date}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />

          {outcomes.map((outcome) => (
            <Area
              key={outcome.name}
              type="monotone"
              dataKey={outcome.name.replace(/\s+/g, "")}
              stroke={
                outcome.color === "positive"
                  ? "hsl(var(--chart-positive))"
                  : "hsl(var(--chart-negative))"
              }
              strokeWidth={2}
              fill={
                outcome.color === "positive"
                  ? "url(#positiveGradient)"
                  : "url(#negativeGradient)"
              }
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProbabilityChart;
