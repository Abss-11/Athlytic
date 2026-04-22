import { useEffect, useState } from "react";
import axios from "axios";
import { reportsApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

interface ScoreBreakdownItem {
  key: string;
  label: string;
  score: number;
}

interface WeeklyReport {
  id: string;
  title: string;
  dateRange: string;
  totalWorkouts: number;
  totalWorkoutDuration: number;
  totalRunningDistance: number;
  avgProtein: number;
  avgCalories: number;
  avgSleep: number;
  performanceScore: number;
  performanceExplanation: string;
  performanceBreakdown: ScoreBreakdownItem[];
}

interface TrendMetric {
  label: string;
  unit: string;
  current: number;
  previous: number;
  delta: number;
  percentChange: number | null;
  direction: "up" | "down" | "flat";
}

interface TrendBlock {
  metrics: TrendMetric[];
  performanceScore: TrendMetric;
  summary: string;
}

interface WeekTrendBlock extends TrendBlock {
  currentWeekLabel: string;
  previousWeekLabel: string;
}

interface ReportsTrendPayload {
  generatedAt: string;
  todayVsYesterday: TrendBlock;
  weekVsWeek: WeekTrendBlock;
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function formatMetricDelta(metric: TrendMetric) {
  const percentText = metric.percentChange === null ? "n/a" : `${formatSigned(metric.percentChange)}%`;
  return `${formatSigned(metric.delta)}${metric.unit} (${percentText})`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [trends, setTrends] = useState<ReportsTrendPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await reportsApi.getWeeklyReports();
        setReports(response.data.reports || []);
        setTrends(response.data.trends || null);
      } catch (requestError) {
        if (axios.isAxiosError(requestError)) {
          setError(requestError.response?.data?.message || "Failed to load reports");
        } else {
          setError("An error occurred while loading reports");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, []);

  async function handleDownloadPdf() {
    try {
      setIsDownloading(true);
      const response = await reportsApi.downloadWeeklyPdf();
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = `athlytic-weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      if (axios.isAxiosError(downloadError)) {
        setError(downloadError.response?.data?.message || "Failed to download PDF report");
      } else {
        setError("Failed to download PDF report");
      }
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Reports"
        title="Weekly Performance Breakdown"
        description="Review today-vs-yesterday and week-vs-week trends, then export your full report as PDF."
      />

      <div className="mb-6 flex justify-end">
        <Button variant="secondary" onClick={handleDownloadPdf} disabled={isLoading || isDownloading}>
          {isDownloading ? "Generating PDF..." : "Download weekly PDF"}
        </Button>
      </div>

      {error ? (
        <Card className="border-red-500/40 bg-red-500/10 text-red-400">
          <p>{error}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-app-text-soft">Aggregating report data...</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {trends ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 border-b border-app-border pb-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-text-soft">Trend Signal</p>
                  <h3 className="mt-2 text-xl font-bold text-app-text">Today vs Yesterday</h3>
                  <p className="mt-1 text-sm text-app-text-soft">{trends.todayVsYesterday.summary}</p>
                </div>
                <div className="mb-4 rounded-2xl bg-app-surface-strong p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-app-text-soft">Performance score</p>
                  <p className="mt-1 text-lg font-semibold text-app-text">
                    {trends.todayVsYesterday.performanceScore.current}{" "}
                    <span className="text-sm text-app-text-soft">
                      ({formatSigned(trends.todayVsYesterday.performanceScore.delta)} vs yesterday)
                    </span>
                  </p>
                </div>
                <div className="space-y-3">
                  {trends.todayVsYesterday.metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between rounded-2xl bg-app-surface-strong px-3 py-2">
                      <p className="text-sm text-app-text">{metric.label}</p>
                      <p className="text-sm text-app-text-soft">{formatMetricDelta(metric)}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-4 border-b border-app-border pb-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-text-soft">Trend Signal</p>
                  <h3 className="mt-2 text-xl font-bold text-app-text">Week vs Week</h3>
                  <p className="mt-1 text-sm text-app-text-soft">{trends.weekVsWeek.summary}</p>
                  <p className="mt-2 text-xs text-app-text-soft">
                    {trends.weekVsWeek.currentWeekLabel} vs {trends.weekVsWeek.previousWeekLabel}
                  </p>
                </div>
                <div className="mb-4 rounded-2xl bg-app-surface-strong p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-app-text-soft">Performance score</p>
                  <p className="mt-1 text-lg font-semibold text-app-text">
                    {trends.weekVsWeek.performanceScore.current}{" "}
                    <span className="text-sm text-app-text-soft">
                      ({formatSigned(trends.weekVsWeek.performanceScore.delta)} vs last week)
                    </span>
                  </p>
                </div>
                <div className="space-y-3">
                  {trends.weekVsWeek.metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between rounded-2xl bg-app-surface-strong px-3 py-2">
                      <p className="text-sm text-app-text">{metric.label}</p>
                      <p className="text-sm text-app-text-soft">{formatMetricDelta(metric)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          {reports.map((report) => (
            <Card key={report.id} className="relative overflow-hidden">
              <div className="mb-6 flex flex-col border-b border-app-border pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-app-text">{report.title}</h3>
                  <p className="mt-1 text-sm text-app-text-soft">Weekly overview and averages</p>
                </div>
                <div className="mt-4 flex items-center gap-3 md:mt-0">
                  <div className="rounded-2xl bg-app-primary/20 px-4 py-2 text-app-primary">
                    <span className="block text-center text-xs uppercase tracking-wider opacity-80">Score</span>
                    <span className="mt-1 block text-center text-xl font-bold leading-none">{report.performanceScore}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-app-border bg-app-surface-strong/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-app-text-soft">Performance score explanation</p>
                <p className="mt-2 text-sm leading-6 text-app-text-soft">{report.performanceExplanation}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {report.performanceBreakdown.map((item) => (
                    <div key={item.key} className="rounded-xl bg-app-surface px-3 py-2">
                      <p className="text-xs text-app-text-soft">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-app-text">{item.score}/100</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Workouts</p>
                  <p className="mt-2 text-2xl font-bold text-app-text">{report.totalWorkouts}</p>
                  <p className="mt-1 text-xs text-app-text-soft">{report.totalWorkoutDuration} mins total</p>
                </div>

                <div className="rounded-2xl bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Running</p>
                  <p className="mt-2 text-2xl font-bold text-app-text">{report.totalRunningDistance} km</p>
                  <p className="mt-1 text-xs text-app-text-soft">Total distance</p>
                </div>

                <div className="rounded-2xl bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Nutrition</p>
                  <p className="mt-2 text-xl font-bold text-app-text">{report.avgCalories} kcal</p>
                  <p className="mt-1 text-xs text-app-text-soft">Avg {report.avgProtein}g protein / day</p>
                </div>

                <div className="rounded-2xl bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Sleep</p>
                  <p className="mt-2 text-2xl font-bold text-app-text">{report.avgSleep} hrs</p>
                  <p className="mt-1 text-xs text-app-text-soft">Daily average</p>
                </div>
              </div>
            </Card>
          ))}

          {reports.length === 0 && !isLoading && !error ? (
            <p className="text-center text-sm text-app-text-soft">No weekly data available yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
