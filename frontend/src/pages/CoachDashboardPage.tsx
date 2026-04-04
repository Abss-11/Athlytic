import { useEffect, useState } from "react";
import axios from "axios";
import { dashboardApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Button from "../components/ui/Button";

export default function CoachDashboardPage() {
  const [summary, setSummary] = useState({
    monitoredAthletes: 0,
    flaggedAthletes: 0,
    averageCompliance: 0,
    notes: [] as string[],
  });

  useEffect(() => {
    async function loadCoachSummary() {
      try {
        const response = await dashboardApi.getCoachDashboard();
        setSummary(response.data);
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadCoachSummary();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Coach portal"
        title="A high-level view of athlete readiness, compliance, and progression."
        description="Assign programs, compare athlete performance, monitor nutrition adherence, and send feedback from a single operations dashboard."
        badge={`${summary.flaggedAthletes} athletes flagged`}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-app-text">Athlete overview</h3>
              <p className="mt-1 text-sm text-app-text-soft">Performance score, training direction, and next action.</p>
            </div>
            <Button>Assign training block</Button>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
              No athletes are connected yet. Invite athletes or create coach-linked accounts to populate this view.
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-semibold text-app-text">Coach actions</h3>
            <div className="mt-4 grid gap-3">
              {summary.notes.length === 0 ? (
                <div className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  No coach actions yet. Tasks will appear once athletes begin logging activity.
                </div>
              ) : (
                summary.notes.map((task) => (
                  <div key={task} className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text">
                    {task}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold text-app-text">Comparison view</h3>
            <div className="mt-4 space-y-4">
              {[
                { label: "Monitored athletes", value: Math.min(100, summary.monitoredAthletes * 20) },
                { label: "Training compliance", value: summary.averageCompliance },
                { label: "Nutrition adherence", value: 0 },
                { label: "Recovery score", value: 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-app-text-soft">{item.label}</span>
                    <span className="font-semibold text-app-text">{item.value}%</span>
                  </div>
                  <ProgressBar value={item.value} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
