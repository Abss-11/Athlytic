import { useEffect, useState } from "react";
import axios from "axios";
import { runningApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { isPositiveNumber } from "../lib/validation";

export default function RunningPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    distanceKm: "",
    durationMinutes: "",
    pace: "",
    vo2Max: "",
  });
  const [sessions, setSessions] = useState<
    { id: string; label: string; distance: number; pace: string; vo2Max: number }[]
  >([]);

  useEffect(() => {
    async function loadRuns() {
      try {
        const response = await runningApi.list();
        setSessions(
          response.data.map(
            (entry: { id: string; distanceKm: number; durationMinutes?: number; pace: string; vo2Max: number }) => ({
              id: entry.id,
              label: `${entry.durationMinutes ?? 0} min session`,
              distance: entry.distanceKm,
              pace: entry.pace,
              vo2Max: entry.vo2Max,
            })
          )
        );
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadRuns();
  }, []);

  async function handleSubmit() {
    if (!isPositiveNumber(form.distanceKm) || !form.pace.trim()) {
      pushToast("Enter a valid distance and pace before saving the run.", "error");
      return;
    }

    const payload = {
      distanceKm: Number(form.distanceKm),
      durationMinutes: Number(form.durationMinutes),
      pace: form.pace,
      vo2Max: Number(form.vo2Max),
      personalRecord: false,
    };

    const response = await runningApi.create(payload);
    setSessions((current) => [
      {
        id: response.data.id,
        label: `${response.data.durationMinutes} min session`,
        distance: response.data.distanceKm,
        pace: response.data.pace,
        vo2Max: response.data.vo2Max,
      },
      ...current,
    ]);
    setForm({ distanceKm: "", durationMinutes: "", pace: "", vo2Max: "" });
    pushToast("Running session saved.", "success");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Running tracker"
        title="Track pace, distance, duration, VO2 Max, and personal records over time."
        description="Use weekly running progress graphs to spot consistency gains, efficiency improvements, and race-readiness trends."
        badge="VO2 Max synced"
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Log a run</h3>
          <div className="mt-5 grid gap-4">
            <Input
              placeholder="Distance (km)"
              value={form.distanceKm}
              onChange={(event) => setForm((current) => ({ ...current, distanceKm: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Duration"
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
              />
              <Input placeholder="Pace" value={form.pace} onChange={(event) => setForm((current) => ({ ...current, pace: event.target.value }))} />
            </div>
            <Input placeholder="VO2 Max" value={form.vo2Max} onChange={(event) => setForm((current) => ({ ...current, vo2Max: event.target.value }))} />
            <Button variant="secondary" type="button" onClick={handleSubmit}>
              Save running session
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Running history</h3>
          <div className="mt-5 grid gap-4">
            {sessions.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No runs logged yet. Start with your first session to build your performance history.
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="rounded-3xl bg-app-surface-strong p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-app-text-soft">{session.label}</p>
                      <h4 className="mt-1 text-xl font-semibold text-app-text">{session.distance} km</h4>
                    </div>
                    <div className="text-sm text-app-text-soft">
                      {session.pace} · VO2 Max {session.vo2Max}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
