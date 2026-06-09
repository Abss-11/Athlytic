import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { runningApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { extractApiErrorMessage, isPositiveNumber } from "../lib/validation";
import {
  RechartsDistanceCard,
  RechartsPaceCard,
  RechartsSpeedCard,
} from "../components/charts/RechartsRunningCharts";

type RunningLog = {
  id: string;
  distanceKm: number;
  durationMinutes: number;
  pace: string;
  vo2Max: number;
  personalRecord: boolean;
  createdAt?: string;
  loggedAt?: string;
};

type RunningForm = {
  distanceKm: string;
  durationMinutes: string;
  pace: string;
  vo2Max: string;
};

const initialForm: RunningForm = {
  distanceKm: "",
  durationMinutes: "",
  pace: "",
  vo2Max: "",
};

function parseOptionalNumber(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toForm(item: RunningLog): RunningForm {
  return {
    distanceKm: String(item.distanceKm),
    durationMinutes: String(item.durationMinutes ?? 0),
    pace: item.pace,
    vo2Max: String(item.vo2Max ?? 0),
  };
}

function calculateSpeed(distanceKm: number, durationMinutes: number): number {
  if (!durationMinutes || durationMinutes <= 0) return 0;
  const speed = distanceKm / (durationMinutes / 60);
  return Number.isFinite(speed) ? parseFloat(speed.toFixed(2)) : 0;
}

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

export default function RunningPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState<RunningForm>(initialForm);

  const autoCalculatePace = (distanceVal: string, durationVal: string) => {
    const d = parseFloat(distanceVal);
    const t = parseFloat(durationVal);
    if (!d || d <= 0 || !t || t <= 0) return "";
    
    const paceDecimal = t / d;
    const mins = Math.floor(paceDecimal);
    const secs = Math.round((paceDecimal - mins) * 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };
  const [sessions, setSessions] = useState<RunningLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedSession, setDeletedSession] = useState<RunningLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadRuns = useCallback(async () => {
    const response = await runningApi.list();
    const rows = Array.isArray(response.data) ? response.data : [];
    setSessions(
      rows.map((entry: any) => ({
        id: entry.id,
        distanceKm: entry.distanceKm ?? 0,
        durationMinutes: entry.durationMinutes ?? 0,
        pace: entry.pace ?? "",
        vo2Max: entry.vo2Max ?? 0,
        personalRecord: Boolean(entry.personalRecord),
        createdAt: entry.createdAt,
        loggedAt: entry.loggedAt,
      }))
    );
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadRuns();
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void load();
  }, [loadRuns]);

  async function handleSubmit() {
    if (!isPositiveNumber(form.distanceKm) || !form.pace.trim()) {
      pushToast("Enter a valid distance and pace before saving the run.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        distanceKm: Number(form.distanceKm),
        durationMinutes: parseOptionalNumber(form.durationMinutes),
        pace: form.pace.trim(),
        vo2Max: parseOptionalNumber(form.vo2Max),
        personalRecord: false,
      };

      if (editingId) {
        await runningApi.update(editingId, payload);
        pushToast("Running session updated.", "success");
      } else {
        await runningApi.create(payload);
        pushToast("Running session saved.", "success");
      }

      await loadRuns();
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not save running session."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(session: RunningLog) {
    setEditingId(session.id);
    setForm(toForm(session));
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleDelete(session: RunningLog) {
    try {
      await runningApi.remove(session.id);
      setDeletedSession(session);
      pushToast("Running session deleted. You can undo this.", "info");
      await loadRuns();
      if (editingId === session.id) {
        handleCancelEdit();
      }
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not delete running session."), "error");
    }
  }

  async function handleUndoDelete() {
    if (!deletedSession) return;

    setIsUndoing(true);
    try {
      await runningApi.create({
        distanceKm: deletedSession.distanceKm,
        durationMinutes: deletedSession.durationMinutes,
        pace: deletedSession.pace,
        vo2Max: deletedSession.vo2Max,
        personalRecord: deletedSession.personalRecord,
      });
      setDeletedSession(null);
      pushToast("Running session restored.", "success");
      await loadRuns();
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not restore running session."), "error");
    } finally {
      setIsUndoing(false);
    }
  }

  // Calculate Best Pace
  const paces = sessions.map(s => parsePaceToDecimal(s.pace)).filter(p => p > 0);
  const bestPaceDecimal = paces.length > 0 ? Math.min(...paces) : 0;
  const bestPaceMins = Math.floor(bestPaceDecimal);
  const bestPaceSecs = Math.round((bestPaceDecimal - bestPaceMins) * 60);
  const bestPaceStr = bestPaceDecimal > 0 ? `${bestPaceMins}:${bestPaceSecs < 10 ? '0' : ''}${bestPaceSecs} /km` : "N/A";

  // Calculate Average Speed
  const speeds = sessions.map(s => calculateSpeed(s.distanceKm, s.durationMinutes)).filter(s => s > 0);
  const avgSpeed = speeds.length > 0 ? (speeds.reduce((sum, s) => sum + s, 0) / speeds.length).toFixed(1) : "0.0";



  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Running tracker"
        title="Track pace, distance, duration, VO2 Max, and personal records over time."
        description="Use weekly running progress graphs to spot consistency gains, efficiency improvements, and race-readiness trends."
        badge={editingId ? "Editing run" : "Edit + delete enabled"}
      />

      {deletedSession ? (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-app-text-soft">
              Deleted run:{" "}
              <span className="font-semibold text-app-text">
                {deletedSession.distanceKm} km ({deletedSession.pace})
              </span>
            </p>
            <Button type="button" variant="secondary" disabled={isUndoing} onClick={handleUndoDelete}>
              {isUndoing ? "Restoring..." : "Undo delete"}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Summary Stats Bar */}
      <section className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-app-border/40 bg-slate-950/40 p-4 text-center backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-app-text-soft">Total Runs</p>
          <p className="mt-1 text-2xl font-bold text-app-text">{sessions.length}</p>
        </div>
        <div className="rounded-2xl border border-app-border/40 bg-slate-950/40 p-4 text-center backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-app-text-soft">Total Distance</p>
          <p className="mt-1 text-2xl font-bold text-app-primary">
            {sessions.reduce((sum, s) => sum + s.distanceKm, 0).toFixed(1)} km
          </p>
        </div>
        <div className="rounded-2xl border border-app-border/40 bg-slate-950/40 p-4 text-center backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-app-text-soft">Best Pace</p>
          <p className="mt-1 text-2xl font-bold text-app-accent">{bestPaceStr}</p>
        </div>
        <div className="rounded-2xl border border-app-border/40 bg-slate-950/40 p-4 text-center backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wider text-app-text-soft">Avg Speed</p>
          <p className="mt-1 text-2xl font-bold text-app-text">{avgSpeed} km/h</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="field-label">Run capture</p>
          <h3 className="mt-2 text-2xl font-semibold text-app-text">{editingId ? "Edit run" : "Log a run"}</h3>
          <div className="mt-5 grid gap-4">
            <Input
              placeholder="Distance (km)"
              value={form.distanceKm}
              onChange={(event) => {
                const val = event.target.value;
                setForm((current) => {
                  const next = { ...current, distanceKm: val };
                  next.pace = autoCalculatePace(next.distanceKm, next.durationMinutes);
                  return next;
                });
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Duration (minutes)"
                value={form.durationMinutes}
                onChange={(event) => {
                  const val = event.target.value;
                  setForm((current) => {
                    const next = { ...current, durationMinutes: val };
                    next.pace = autoCalculatePace(next.distanceKm, next.durationMinutes);
                    return next;
                  });
                }}
              />
              <div className="flex items-center justify-center rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text-soft">
                Pace: {form.pace ? `${form.pace} /km` : "--:--"}
              </div>
            </div>
            <Input
              placeholder="VO2 Max"
              value={form.vo2Max}
              onChange={(event) => setForm((current) => ({ ...current, vo2Max: event.target.value }))}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingId ? "Update running session" : "Save running session"}
              </Button>
              {editingId ? (
                <Button variant="ghost" type="button" onClick={handleCancelEdit}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <p className="field-label">Progression</p>
          <h3 className="mt-2 text-2xl font-semibold text-app-text">Running history</h3>
          <div className="mt-5 grid gap-4">
            {sessions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-app-border bg-app-surface-strong/80 p-5 text-sm text-app-text-soft">
                No runs logged yet. Start with your first session to build your performance history.
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="surface-tile rounded-3xl p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-app-text-soft">{session.durationMinutes} min session</p>
                      <h4 className="mt-1 text-xl font-semibold text-app-text">{session.distanceKm} km</h4>
                      <p className="mt-1 text-xs text-app-text-soft">
                        Pace {session.pace} · Speed {calculateSpeed(session.distanceKm, session.durationMinutes)} km/h · VO2 Max {session.vo2Max}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => handleEdit(session)}>
                        Edit
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => handleDelete(session)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Progress Charts Section */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <RechartsDistanceCard sessions={sessions} />
        <RechartsPaceCard sessions={sessions} />
        <RechartsSpeedCard sessions={sessions} />
      </section>
    </div>
  );
}
