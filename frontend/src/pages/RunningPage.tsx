import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { runningApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { extractApiErrorMessage, isPositiveNumber } from "../lib/validation";

type RunningLog = {
  id: string;
  distanceKm: number;
  durationMinutes: number;
  pace: string;
  vo2Max: number;
  personalRecord: boolean;
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

export default function RunningPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState<RunningForm>(initialForm);
  const [sessions, setSessions] = useState<RunningLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedSession, setDeletedSession] = useState<RunningLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadRuns = useCallback(async () => {
    const response = await runningApi.list();
    const rows = Array.isArray(response.data) ? response.data : [];
    setSessions(
      rows.map((entry: RunningLog) => ({
        id: entry.id,
        distanceKm: entry.distanceKm ?? 0,
        durationMinutes: entry.durationMinutes ?? 0,
        pace: entry.pace ?? "",
        vo2Max: entry.vo2Max ?? 0,
        personalRecord: Boolean(entry.personalRecord),
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

  return (
    <div>
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

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">{editingId ? "Edit run" : "Log a run"}</h3>
          <div className="mt-5 grid gap-4">
            <Input
              placeholder="Distance (km)"
              value={form.distanceKm}
              onChange={(event) => setForm((current) => ({ ...current, distanceKm: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Duration (minutes)"
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
              />
              <Input
                placeholder="Pace (e.g. 5:30 /km)"
                value={form.pace}
                onChange={(event) => setForm((current) => ({ ...current, pace: event.target.value }))}
              />
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
                      <p className="text-sm text-app-text-soft">{session.durationMinutes} min session</p>
                      <h4 className="mt-1 text-xl font-semibold text-app-text">{session.distanceKm} km</h4>
                      <p className="mt-1 text-xs text-app-text-soft">Pace {session.pace} · VO2 Max {session.vo2Max}</p>
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
    </div>
  );
}
