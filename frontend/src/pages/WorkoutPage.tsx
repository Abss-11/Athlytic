import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { workoutApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { extractApiErrorMessage, isPositiveNumber } from "../lib/validation";

type WorkoutLog = {
  id: string;
  focus: string;
  sets: number;
  reps: number;
  weightLifted: number;
  durationMinutes: number;
  intensity: string;
};

type WorkoutForm = {
  focus: string;
  sets: string;
  reps: string;
  weightLifted: string;
  durationMinutes: string;
};

const initialForm: WorkoutForm = {
  focus: "",
  sets: "",
  reps: "",
  weightLifted: "",
  durationMinutes: "",
};

function parseOptionalNumber(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toForm(item: WorkoutLog): WorkoutForm {
  return {
    focus: item.focus,
    sets: String(item.sets),
    reps: String(item.reps),
    weightLifted: String(item.weightLifted ?? 0),
    durationMinutes: String(item.durationMinutes ?? 0),
  };
}

export default function WorkoutPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState<WorkoutForm>(initialForm);
  const [items, setItems] = useState<WorkoutLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedItem, setDeletedItem] = useState<WorkoutLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadWorkouts = useCallback(async () => {
    const response = await workoutApi.list();
    const rows = Array.isArray(response.data) ? response.data : [];
    setItems(
      rows.map((entry: WorkoutLog) => ({
        id: entry.id,
        focus: entry.focus,
        sets: entry.sets ?? 0,
        reps: entry.reps ?? 0,
        weightLifted: entry.weightLifted ?? 0,
        durationMinutes: entry.durationMinutes ?? 0,
        intensity: entry.intensity ?? "Medium",
      }))
    );
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadWorkouts();
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void load();
  }, [loadWorkouts]);

  async function handleSubmit() {
    if (!form.focus.trim() || !isPositiveNumber(form.sets) || !isPositiveNumber(form.reps)) {
      pushToast("Enter a workout focus with valid sets and reps.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        focus: form.focus.trim(),
        sets: Number(form.sets),
        reps: Number(form.reps),
        weightLifted: parseOptionalNumber(form.weightLifted),
        durationMinutes: parseOptionalNumber(form.durationMinutes),
        intensity: "Medium",
      };

      if (editingId) {
        await workoutApi.update(editingId, payload);
        pushToast("Workout updated successfully.", "success");
      } else {
        await workoutApi.create(payload);
        pushToast("Workout logged successfully.", "success");
      }

      await loadWorkouts();
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not save workout."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(item: WorkoutLog) {
    setEditingId(item.id);
    setForm(toForm(item));
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleDelete(item: WorkoutLog) {
    try {
      await workoutApi.remove(item.id);
      setDeletedItem(item);
      pushToast("Workout deleted. You can undo this.", "info");
      await loadWorkouts();
      if (editingId === item.id) {
        handleCancelEdit();
      }
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not delete workout."), "error");
    }
  }

  async function handleUndoDelete() {
    if (!deletedItem) return;

    setIsUndoing(true);
    try {
      await workoutApi.create({
        focus: deletedItem.focus,
        sets: deletedItem.sets,
        reps: deletedItem.reps,
        weightLifted: deletedItem.weightLifted,
        durationMinutes: deletedItem.durationMinutes,
        intensity: deletedItem.intensity,
      });
      setDeletedItem(null);
      pushToast("Workout restored.", "success");
      await loadWorkouts();
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not restore workout."), "error");
    } finally {
      setIsUndoing(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workout tracker"
        title="Capture lifting, sports training, and session quality in seconds."
        description="Log chest, back, legs, shoulders, arms, core, and sports sessions with sets, reps, weight, duration, and strength progression."
        badge={editingId ? "Editing workout" : "Edit + delete enabled"}
      />

      {deletedItem ? (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-app-text-soft">
              Deleted: <span className="font-semibold text-app-text">{deletedItem.focus}</span>
            </p>
            <Button type="button" variant="secondary" disabled={isUndoing} onClick={handleUndoDelete}>
              {isUndoing ? "Restoring..." : "Undo delete"}
            </Button>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">{editingId ? "Edit workout" : "Add workout"}</h3>
          <div className="mt-5 grid gap-4">
            <Input
              placeholder="Workout focus"
              value={form.focus}
              onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Sets"
                value={form.sets}
                onChange={(event) => setForm((current) => ({ ...current, sets: event.target.value }))}
              />
              <Input
                placeholder="Reps"
                value={form.reps}
                onChange={(event) => setForm((current) => ({ ...current, reps: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Weight lifted"
                value={form.weightLifted}
                onChange={(event) => setForm((current) => ({ ...current, weightLifted: event.target.value }))}
              />
              <Input
                placeholder="Duration (minutes)"
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingId ? "Update workout" : "Log training session"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Recent sessions</h3>
          <div className="mt-5 grid gap-4">
            {items.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No workouts logged yet. Your first training session will appear here.
              </div>
            ) : (
              items.map((workout) => (
                <div key={workout.id} className="rounded-3xl bg-app-surface-strong p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-app-text">{workout.focus}</h4>
                      <p className="mt-1 text-sm text-app-text-soft">
                        {workout.sets} sets · {workout.reps} reps
                      </p>
                      <p className="mt-1 text-xs text-app-text-soft">
                        {workout.durationMinutes} min · {workout.weightLifted} kg · {workout.intensity}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => handleEdit(workout)}>
                        Edit
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => handleDelete(workout)}>
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
