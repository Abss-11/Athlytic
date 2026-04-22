import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { reportsApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";

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
  scoreBand: string;
  focusTip: string;
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

function formatPercent(value: number | null) {
  if (value === null) {
    return "new";
  }

  return `${formatSigned(value)}%`;
}

function formatCurrent(metric: TrendMetric) {
  return `${metric.current}${metric.unit}`;
}

function formatDelta(metric: TrendMetric) {
  return `${formatSigned(metric.delta)}${metric.unit}`;
}

function toneClass(direction: "up" | "down" | "flat") {
  if (direction === "up") {
    return "text-emerald-300";
  }
  if (direction === "down") {
    return "text-amber-300";
  }
  return "text-app-text-soft";
}

function scoreToneClass(score: number) {
  if (score >= 85) {
    return "text-emerald-300";
  }
  if (score >= 70) {
    return "text-lime-300";
  }
  if (score >= 50) {
    return "text-amber-300";
  }
  return "text-rose-300";
}

function renderTrendCard(title: string, subtitle: string, block: TrendBlock, note?: string) {
  return (
    <Card>
      <div className="mb-5 border-b border-app-border pb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-app-text-soft">Trend Signal</p>
        <h3 className="mt-2 text-xl font-semibold text-app-text">{title}</h3>
        <p className="mt-1 text-sm text-app-text-soft">{subtitle}</p>
        {note ? <p className="mt-1 text-xs text-app-text-soft">{note}</p> : null}
      </div>

      <div className="mb-4 rounded-2xl border border-app-border/70 bg-app-surface-strong/80 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-app-text-soft">Performance score</p>
            <p className={`mt-1 text-2xl font-bold ${scoreToneClass(block.performanceScore.current)}`}>
              {block.performanceScore.current}
            </p>
          </div>
          <p className={`text-sm font-semibold ${toneClass(block.performanceScore.direction)}`}>
            {formatSigned(block.performanceScore.delta)} vs previous
          </p>
        </div>
        <p className="mt-2 text-sm text-app-text-soft">{block.summary}</p>
      </div>

      <div className="space-y-3">
        {block.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-app-border/70 bg-app-surface-strong/70 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-app-text">{metric.label}</p>
              <p className="text-sm font-semibold text-app-text">{formatCurrent(metric)}</p>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <p className="text-app-text-soft">Prev {metric.previous}{metric.unit}</p>
              <p className={`font-semibold ${toneClass(metric.direction)}`}>
                {formatDelta(metric)} ({formatPercent(metric.percentChange)})
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
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

  const thisWeekReport = reports[0] || null;
  const lastWeekReport = reports[1] || null;

  const scoreDelta = useMemo(() => {
    if (!thisWeekReport || !lastWeekReport) {
      return 0;
    }
    return thisWeekReport.performanceScore - lastWeekReport.performanceScore;
  }, [thisWeekReport, lastWeekReport]);

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Reports"
        title="Weekly Performance Breakdown"
        description="Clean trend intelligence, score diagnostics, and downloadable weekly reporting for athletes and coaches."
        badge="Auto Report"
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-app-text-soft">Report Snapshot</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong/70 p-3">
              <p className="text-xs text-app-text-soft">This week score</p>
              <p className={`mt-1 text-2xl font-bold ${scoreToneClass(thisWeekReport?.performanceScore || 0)}`}>
                {thisWeekReport?.performanceScore ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong/70 p-3">
              <p className="text-xs text-app-text-soft">Week-over-week</p>
              <p className={`mt-1 text-2xl font-bold ${scoreDelta >= 0 ? "text-emerald-300" : "text-amber-300"}`}>
                {formatSigned(scoreDelta)}
              </p>
            </div>
            <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong/70 p-3">
              <p className="text-xs text-app-text-soft">Generated</p>
              <p className="mt-1 text-sm font-semibold text-app-text">
                {trends ? new Date(trends.generatedAt).toLocaleString("en-US") : "Pending"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-start justify-between gap-4 p-5 md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-app-text-soft">Export</p>
            <h3 className="mt-2 text-lg font-semibold text-app-text">Professional Weekly PDF</h3>
            <p className="mt-1 text-sm text-app-text-soft">
              Includes structured trend tables, score band, breakdown bars, and focus recommendations.
            </p>
          </div>
          <Button variant="secondary" onClick={handleDownloadPdf} disabled={isLoading || isDownloading}>
            {isDownloading ? "Generating PDF..." : "Download Weekly PDF"}
          </Button>
        </Card>
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
              {renderTrendCard("Today vs Yesterday", "Daily movement snapshot", trends.todayVsYesterday)}
              {renderTrendCard(
                "Week vs Week",
                "Performance consistency comparison",
                trends.weekVsWeek,
                `${trends.weekVsWeek.currentWeekLabel} vs ${trends.weekVsWeek.previousWeekLabel}`
              )}
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
                  <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong px-4 py-2 text-center">
                    <span className="block text-xs uppercase tracking-wider text-app-text-soft">Score</span>
                    <span className={`mt-1 block text-2xl font-bold ${scoreToneClass(report.performanceScore)}`}>
                      {report.performanceScore}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-app-text-soft">{report.scoreBand}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-app-border bg-app-surface-strong/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-app-text-soft">Performance score explanation</p>
                  <p className="text-xs text-app-text-soft">Focus: {report.focusTip}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-app-text-soft">{report.performanceExplanation}</p>
                <div className="mt-3">
                  <ProgressBar value={report.performanceScore} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {report.performanceBreakdown.map((item) => (
                    <div key={item.key} className="rounded-xl border border-app-border/70 bg-app-surface px-3 py-2">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs text-app-text-soft">{item.label}</p>
                        <p className="text-xs font-semibold text-app-text">{item.score}/100</p>
                      </div>
                      <ProgressBar value={item.score} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Workouts</p>
                  <p className="mt-2 text-2xl font-bold text-app-text">{report.totalWorkouts}</p>
                  <p className="mt-1 text-xs text-app-text-soft">{report.totalWorkoutDuration} mins total</p>
                </div>

                <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Running</p>
                  <p className="mt-2 text-2xl font-bold text-app-text">{report.totalRunningDistance} km</p>
                  <p className="mt-1 text-xs text-app-text-soft">Total distance</p>
                </div>

                <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong p-4">
                  <p className="text-xs uppercase tracking-wider text-app-text-soft">Nutrition</p>
                  <p className="mt-2 text-xl font-bold text-app-text">{report.avgCalories} kcal</p>
                  <p className="mt-1 text-xs text-app-text-soft">Avg {report.avgProtein}g protein / day</p>
                </div>

                <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong p-4">
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
