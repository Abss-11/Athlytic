import "../../lib/chartSetup";
import type { ChartData } from "chart.js";
import { Line } from "react-chartjs-2";
import Card from "../ui/Card";

export default function LineChartCard({
  title,
  subtitle,
  data,
  emptyMessage = "No data yet. Start logging activity to populate this chart.",
  reverseY = false,
}: {
  title: string;
  subtitle: string;
  data: ChartData<"line">;
  emptyMessage?: string;
  reverseY?: boolean;
}) {
  const hasData = Array.isArray(data?.datasets) && data.datasets.some((dataset: { data?: unknown[] }) => Array.isArray(dataset.data) && dataset.data.some((val) => Number(val) > 0));

  return (
    <Card className="border-app-border/80">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-app-text">{title}</h3>
          <p className="mt-1 text-sm text-app-text-soft">{subtitle}</p>
        </div>
        {reverseY && (
          <span className="rounded-full border border-app-accent/30 bg-app-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-app-accent animate-pulse shrink-0">
            ⚡ Lower is faster
          </span>
        )}
      </div>
      <div className="h-[280px] rounded-3xl border border-app-border/60 bg-app-surface-soft/70 p-3 shadow-inner">
        {hasData ? (
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: "rgb(var(--surface))",
                  titleColor: "rgb(var(--text))",
                  bodyColor: "rgb(var(--text-soft))",
                  borderColor: "rgb(var(--border))",
                  borderWidth: 1,
                  padding: 12,
                },
              },
              elements: {
                line: { borderWidth: 3, tension: 0.38 },
                point: { radius: 3, hoverRadius: 6 },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "rgb(var(--text-soft))" },
                },
                y: {
                  reverse: reverseY,
                  grid: { color: "rgba(var(--border), 0.35)" },
                  ticks: { color: "rgb(var(--text-soft))" },
                },
              },
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-strong/80 px-6 text-center">
            <div className="mb-4 h-16 w-32 skeleton" />
            <p className="max-w-sm text-sm leading-6 text-app-text-soft">{emptyMessage}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
