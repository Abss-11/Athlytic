import { useEffect, useState } from "react";
import axios from "axios";
import { reportsApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await reportsApi.getWeeklyReports();
        setReports(res.data.reports || []);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load reports");
        } else {
          setError("An error occurred while loading reports");
        }
      } finally {
        setIsLoading(false);
      }
    }
    void loadReports();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Reports"
        title="Weekly Performance Breakdown"
        description="Review your aggregated stats over the past several weeks. Gain insights into your overall consistency, total workout volume, and sleep quality."
      />

      {error ? (
        <Card className="border-red-500/40 bg-red-500/10 text-red-400">
          <p>{error}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-app-text-soft">Aggregating report data...</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="relative overflow-hidden">
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-app-border pb-4">
                <div>
                  <h3 className="text-xl font-bold text-app-text">{report.title}</h3>
                  <p className="mt-1 text-sm text-app-text-soft">Weekly overview and averages</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  <div className="rounded-2xl bg-app-primary/20 px-4 py-2 text-app-primary">
                    <span className="text-xs uppercase tracking-wider block text-center opacity-80">Score</span>
                    <span className="text-xl font-bold block text-center leading-none mt-1">{report.performanceScore}</span>
                  </div>
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
          {reports.length === 0 && !isLoading && !error && (
            <p className="text-center text-sm text-app-text-soft">No weekly data available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
