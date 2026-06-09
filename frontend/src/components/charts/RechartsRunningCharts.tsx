import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import Card from "../ui/Card";

// Types matching Athlytic codebase
export type RunningLog = {
  id: string;
  distanceKm: number;
  durationMinutes: number;
  pace: string;
  vo2Max: number;
  personalRecord: boolean;
  createdAt?: string;
  loggedAt?: string;
};

// Internal parsing helpers
function parsePaceToDecimal(paceStr: string): number {
  if (!paceStr) return 0;
  const match = paceStr.match(/(\d+):(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    return mins + secs / 60;
  }
  const num = parseFloat(paceStr);
  return Number.isFinite(num) ? num : 0;
}

function formatDecimalToPace(decimal: number): string {
  if (!decimal || isNaN(decimal) || decimal <= 0) return "--:--";
  const mins = Math.floor(decimal);
  const secs = Math.round((decimal - mins) * 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function calculateSpeed(distanceKm: number, durationMinutes: number): number {
  if (!durationMinutes || durationMinutes <= 0) return 0;
  const speed = distanceKm / (durationMinutes / 60);
  return Number.isFinite(speed) ? parseFloat(speed.toFixed(2)) : 0;
}

// Custom Tooltip component displaying all details on hover
const RunningTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as RunningLog & { dateLabel: string; paceDecimal: number; speed: number; index: number };
    const dateStr = data.loggedAt || data.createdAt;
    const formattedDate = dateStr
      ? new Date(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
      : `Session ${data.index + 1}`;

    return (
      <div className="rounded-2xl border border-app-border/40 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md text-xs leading-5">
        <p className="font-semibold text-app-text-soft border-b border-app-border/20 pb-1 mb-2">{formattedDate}</p>
        <div className="space-y-1">
          <p className="text-app-text">
            <span className="font-medium text-app-text-soft">Distance:</span>{" "}
            <span className="font-semibold text-app-primary">{data.distanceKm} km</span>
          </p>
          <p className="text-app-text">
            <span className="font-medium text-app-text-soft">Pace:</span>{" "}
            <span className="font-semibold text-app-accent">{data.pace} /km</span>
          </p>
          <p className="text-app-text">
            <span className="font-medium text-app-text-soft">Speed:</span>{" "}
            <span className="font-semibold text-sky-400">{data.speed} km/h</span>
          </p>
          <p className="text-app-text">
            <span className="font-medium text-app-text-soft">VO2 Max:</span>{" "}
            <span className="font-semibold text-purple-400">{data.vo2Max}</span>
          </p>
          {data.durationMinutes ? (
            <p className="text-app-text">
              <span className="font-medium text-app-text-soft">Duration:</span>{" "}
              <span className="font-semibold text-amber-400">{data.durationMinutes} mins</span>
            </p>
          ) : null}
        </div>
      </div>
    );
  }
  return null;
};

// Helper to find best and worst run indices
const getExtremeIndices = (data: any[], key: string, isLowerBetter: boolean) => {
  if (data.length === 0) return { bestIndex: -1, worstIndex: -1 };
  
  let bestIdx = 0;
  let worstIdx = 0;
  
  for (let i = 1; i < data.length; i++) {
    const val = data[i][key];
    const bestVal = data[bestIdx][key];
    const worstVal = data[worstIdx][key];
    
    if (isLowerBetter) {
      if (val < bestVal) bestIdx = i;
      if (val > worstVal) worstIdx = i;
    } else {
      if (val > bestVal) bestIdx = i;
      if (val < worstVal) worstIdx = i;
    }
  }
  
  // Handle case where values are equal
  if (data[bestIdx][key] === data[worstIdx][key]) {
    return { bestIndex: -1, worstIndex: -1 };
  }
  
  return { bestIndex: bestIdx, worstIndex: worstIdx };
};

// Helper to generate horizontal linear gradient stops based on progress (consecutive session comparisons)
function generateGradientStops(
  data: any[],
  key: string,
  isLowerBetter: boolean,
  opacity: number = 1.0,
  colorSuccess: string = "#10b981", // green
  colorDanger: string = "#ef4444"    // red
) {
  if (data.length <= 1) {
    return [<stop key="single" offset="100%" stopColor={colorSuccess} stopOpacity={opacity} />];
  }
  
  const stops: React.ReactNode[] = [];
  const total = data.length;
  
  for (let i = 1; i < total; i++) {
    const val = data[i][key];
    const prevVal = data[i - 1][key];
    const isImprovement = isLowerBetter ? val < prevVal : val > prevVal;
    const color = isImprovement ? colorSuccess : colorDanger;
    
    const prevPct = `${((i - 1) / (total - 1)) * 100}%`;
    const pct = `${(i / (total - 1)) * 100}%`;
    
    stops.push(<stop key={`stop-${i}-prev`} offset={prevPct} stopColor={color} stopOpacity={opacity} />);
    stops.push(<stop key={`stop-${i}-curr`} offset={pct} stopColor={color} stopOpacity={opacity} />);
  }
  
  return stops;
}

// 1. Distance Bar Chart Card
export function RechartsDistanceCard({ sessions }: { sessions: RunningLog[] }) {
  const chartData = useMemo(() => {
    return sessions.map((session, index) => {
      const dateStr = session.loggedAt || session.createdAt;
      const dateLabel = dateStr
        ? new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : `Run ${index + 1}`;
      const paceDecimal = parsePaceToDecimal(session.pace);
      const speed = calculateSpeed(session.distanceKm, session.durationMinutes);
      return {
        ...session,
        dateLabel,
        paceDecimal,
        speed,
        index,
      };
    });
  }, [sessions]);

  const { bestIndex, worstIndex } = useMemo(() => {
    return getExtremeIndices(chartData, "distanceKm", false);
  }, [chartData]);

  const hasData = chartData.length > 0;

  // Custom label above best/worst bars
  const CustomBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    if (index === bestIndex) {
      return (
        <text x={x + width / 2} y={y - 8} fill="#10b981" fontSize={9} fontWeight="bold" textAnchor="middle">
          ★ BEST
        </text>
      );
    }
    if (index === worstIndex) {
      return (
        <text x={x + width / 2} y={y - 8} fill="#ef4444" fontSize={9} fontWeight="bold" textAnchor="middle">
          ▼ WORST
        </text>
      );
    }
    return null;
  };

  return (
    <Card className="border-app-border/40 !bg-[#0f1117] backdrop-blur-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-app-text">Distance per run</h3>
        <p className="mt-1 text-sm text-app-text-soft">Distance covered in kilometers for each recorded session.</p>
      </div>
      <div className="h-[280px] rounded-3xl border border-app-border/30 bg-slate-950/20 p-3 shadow-inner">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="distanceGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="distanceRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
                tickLine={false}
                label={{ value: "km", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, offset: 10 }}
              />
              <Tooltip content={<RunningTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.03)", radius: 12 }} />
              <Bar dataKey="distanceKm" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1000} label={<CustomBarLabel />}>
                {chartData.map((entry, index) => {
                  const isBest = index === bestIndex;
                  const isWorst = index === worstIndex;
                  const isImprovement = index === 0 || entry.distanceKm >= chartData[index - 1].distanceKm;
                  
                  let stroke = "none";
                  let strokeWidth = 0;
                  
                  if (isBest) {
                    stroke = "#ffffff";
                    strokeWidth = 1.5;
                  } else if (isWorst) {
                    stroke = "#ef4444";
                    strokeWidth = 1.5;
                  }

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isImprovement ? "url(#distanceGreenGrad)" : "url(#distanceRedGrad)"}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-strong/80 px-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-app-text-soft">No runs logged yet. Log a session to see your distance chart.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// 2. Pace Improvement Line Chart Card (Flipped Y-Axis)
export function RechartsPaceCard({ sessions }: { sessions: RunningLog[] }) {
  const chartData = useMemo(() => {
    return sessions.map((session, index) => {
      const dateStr = session.loggedAt || session.createdAt;
      const dateLabel = dateStr
        ? new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : `Run ${index + 1}`;
      const paceDecimal = parsePaceToDecimal(session.pace);
      const speed = calculateSpeed(session.distanceKm, session.durationMinutes);
      return {
        ...session,
        dateLabel,
        paceDecimal,
        speed,
        index,
      };
    });
  }, [sessions]);

  const { bestIndex, worstIndex } = useMemo(() => {
    return getExtremeIndices(chartData, "paceDecimal", true); // lower is better
  }, [chartData]);

  const hasData = chartData.length > 0;

  // Custom stops for gradient
  const lineStops = useMemo(() => generateGradientStops(chartData, "paceDecimal", true, 1.0), [chartData]);
  const areaStops = useMemo(() => generateGradientStops(chartData, "paceDecimal", true, 0.15), [chartData]);

  // Custom Dot component with pulsing animations
  const CustomPaceDot = (props: any) => {
    const { cx, cy, index, payload } = props;
    if (index === bestIndex) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={14} fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth={1.5}>
            <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={5} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
          <text x={cx} y={cy - 12} fill="#10b981" fontSize={9} fontWeight="bold" textAnchor="middle">
            ★ BEST
          </text>
        </g>
      );
    }
    if (index === worstIndex) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={14} fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth={1.5}>
            <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          <text x={cx} y={cy - 12} fill="#ef4444" fontSize={9} fontWeight="bold" textAnchor="middle">
            ▼ WORST
          </text>
        </g>
      );
    }
    const isImprovement = index === 0 || payload.paceDecimal < chartData[index - 1].paceDecimal;
    const dotColor = isImprovement ? "#10b981" : "#ef4444";
    return <circle cx={cx} cy={cy} r={3.5} fill={dotColor} stroke="#0f1117" strokeWidth={1.5} />;
  };

  return (
    <Card className="border-app-border/40 !bg-[#0f1117] backdrop-blur-md">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-app-text">Pace improvement over time</h3>
          <p className="mt-1 text-sm text-app-text-soft">Pace trend in minutes per kilometer.</p>
        </div>
        <span className="rounded-full border border-app-accent/30 bg-app-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-app-accent animate-pulse shrink-0">
          ⚡ Lower is faster
        </span>
      </div>
      <div className="h-[280px] rounded-3xl border border-app-border/30 bg-slate-950/20 p-3 shadow-inner">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="paceLineGrad" x1="0" y1="0" x2="1" y2="0">
                  {lineStops}
                </linearGradient>
                <linearGradient id="paceAreaGrad" x1="0" y1="0" x2="1" y2="0">
                  {areaStops}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                reversed={true} // Flip the pace chart so lower pace values rise to the top
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={formatDecimalToPace}
                label={{ value: "min/km", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, offset: 10 }}
              />
              <Tooltip content={<RunningTooltip />} />
              <Area
                type="monotone"
                dataKey="paceDecimal"
                stroke="url(#paceLineGrad)"
                strokeWidth={3}
                fill="url(#paceAreaGrad)"
                dot={<CustomPaceDot />}
                activeDot={{ r: 6, strokeWidth: 1.5, stroke: "#ffffff" }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-strong/80 px-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-app-text-soft">No runs logged yet. Log a session to see your pace progression.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// 3. Speed Line Chart Card
export function RechartsSpeedCard({ sessions }: { sessions: RunningLog[] }) {
  const chartData = useMemo(() => {
    return sessions.map((session, index) => {
      const dateStr = session.loggedAt || session.createdAt;
      const dateLabel = dateStr
        ? new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : `Run ${index + 1}`;
      const paceDecimal = parsePaceToDecimal(session.pace);
      const speed = calculateSpeed(session.distanceKm, session.durationMinutes);
      return {
        ...session,
        dateLabel,
        paceDecimal,
        speed,
        index,
      };
    });
  }, [sessions]);

  const { bestIndex, worstIndex } = useMemo(() => {
    return getExtremeIndices(chartData, "speed", false); // higher is better
  }, [chartData]);

  const hasData = chartData.length > 0;

  // Custom stops for gradient
  const lineStops = useMemo(() => generateGradientStops(chartData, "speed", false, 1.0), [chartData]);
  const areaStops = useMemo(() => generateGradientStops(chartData, "speed", false, 0.15), [chartData]);

  // Custom Dot component with pulsing animations
  const CustomSpeedDot = (props: any) => {
    const { cx, cy, index, payload } = props;
    if (index === bestIndex) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={14} fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth={1.5}>
            <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={5} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
          <text x={cx} y={cy - 12} fill="#10b981" fontSize={9} fontWeight="bold" textAnchor="middle">
            ★ BEST
          </text>
        </g>
      );
    }
    if (index === worstIndex) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={14} fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth={1.5}>
            <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
          <text x={cx} y={cy - 12} fill="#ef4444" fontSize={9} fontWeight="bold" textAnchor="middle">
            ▼ WORST
          </text>
        </g>
      );
    }
    const isImprovement = index === 0 || payload.speed > chartData[index - 1].speed;
    const dotColor = isImprovement ? "#10b981" : "#ef4444";
    return <circle cx={cx} cy={cy} r={3.5} fill={dotColor} stroke="#0f1117" strokeWidth={1.5} />;
  };

  return (
    <Card className="border-app-border/40 !bg-[#0f1117] backdrop-blur-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-app-text">Speed over time</h3>
        <p className="mt-1 text-sm text-app-text-soft">Average speed trend in km/h for each session.</p>
      </div>
      <div className="h-[280px] rounded-3xl border border-app-border/30 bg-slate-950/20 p-3 shadow-inner">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="speedLineGrad" x1="0" y1="0" x2="1" y2="0">
                  {lineStops}
                </linearGradient>
                <linearGradient id="speedAreaGrad" x1="0" y1="0" x2="1" y2="0">
                  {areaStops}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
                tickLine={false}
                domain={["auto", "auto"]}
                label={{ value: "km/h", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, offset: 10 }}
              />
              <Tooltip content={<RunningTooltip />} />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="url(#speedLineGrad)"
                strokeWidth={3}
                fill="url(#speedAreaGrad)"
                dot={<CustomSpeedDot />}
                activeDot={{ r: 6, strokeWidth: 1.5, stroke: "#ffffff" }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-strong/80 px-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-app-text-soft">No runs logged yet. Log a session to see your speed progression.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
