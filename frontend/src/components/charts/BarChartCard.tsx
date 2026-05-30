import "../../lib/chartSetup";
import type { ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";
import Card from "../ui/Card";

export default function BarChartCard({
  title,
  subtitle,
  data,
  emptyMessage = "No data yet. Add entries to start seeing progress here.",
}: {
  title: string;
  subtitle: string;
  data: ChartData<"bar">;
  emptyMessage?: string;
}) {
  const hasData = Array.isArray(data?.datasets) && data.datasets.some((dataset: { data?: unknown[] }) => Array.isArray(dataset.data) && dataset.data.some((val) => Number(val) > 0));

  return (
    <Card className="border-app-border/40 bg-slate-950/60 backdrop-blur-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-app-text">{title}</h3>
        <p className="mt-1 text-sm text-app-text-soft">{subtitle}</p>
      </div>
      <div className="h-[280px] rounded-3xl border border-app-border/30 bg-slate-950/20 p-3 shadow-inner">
        {hasData ? (
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: "rgb(var(--text-soft))" },
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
                bar: { borderRadius: 12, borderSkipped: false },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "rgb(var(--text-soft))" },
                },
                y: {
                  grid: { color: "rgba(var(--border), 0.35)" },
                  ticks: { color: "rgb(var(--text-soft))" },
                },
              },
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-strong/80 px-6 text-center">
            <div className="mb-4 grid h-16 w-32 grid-cols-4 items-end gap-2">
              <span className="skeleton h-7" />
              <span className="skeleton h-12" />
              <span className="skeleton h-9" />
              <span className="skeleton h-14" />
            </div>
            <p className="max-w-sm text-sm leading-6 text-app-text-soft">{emptyMessage}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
