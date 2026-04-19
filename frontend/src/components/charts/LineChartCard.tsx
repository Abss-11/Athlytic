import "../../lib/chartSetup";
import { Line } from "react-chartjs-2";
import Card from "../ui/Card";

export default function LineChartCard({
  title,
  subtitle,
  data,
  emptyMessage = "No data yet. Start logging activity to populate this chart.",
}: {
  title: string;
  subtitle: string;
  data: any;
  emptyMessage?: string;
}) {
  const hasData = Array.isArray(data?.datasets) && data.datasets.some((dataset: { data?: unknown[] }) => Array.isArray(dataset.data) && dataset.data.some((val) => Number(val) > 0));

  return (
    <Card className="border-app-border/80">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-app-text">{title}</h3>
        <p className="mt-1 text-sm text-app-text-soft">{subtitle}</p>
      </div>
      <div className="h-[260px] rounded-3xl border border-app-border/60 bg-app-surface-soft/60 p-3">
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
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-strong px-6 text-center text-sm leading-6 text-app-text-soft">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  );
}
