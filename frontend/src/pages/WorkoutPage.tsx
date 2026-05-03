import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { workoutApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ProgressBar from "../components/ui/ProgressBar";
import { useToast } from "../context/ToastContext";
import { extractApiErrorMessage, isPositiveNumber } from "../lib/validation";

type WorkoutIntensity = "Low" | "Medium" | "High" | "Max";

type WorkoutExercise = {
  name: string;
  bodyRegion: string;
  sets: number;
  reps: number;
  weightLifted: number;
  restSeconds?: number;
};

type WorkoutLog = {
  id: string;
  focus: string;
  bodyRegion: string;
  sets: number;
  reps: number;
  weightLifted: number;
  totalLoadKg: number;
  durationMinutes: number;
  intensity: WorkoutIntensity;
  createdAt?: string;
  loggedAt?: string;
  exercises?: WorkoutExercise[];
};

type ExerciseForm = {
  id: string;
  name: string;
  bodyRegion: string;
  sets: string;
  reps: string;
  weightLifted: string;
  restSeconds: string;
};

type WorkoutForm = {
  focus: string;
  durationMinutes: string;
  intensity: WorkoutIntensity;
  exercises: ExerciseForm[];
};

type WorkoutSnapshot = {
  sessions: number;
  exercises: number;
  sets: number;
  durationMinutes: number;
  volumeKg: number;
};

type MuscleGroupTrend = {
  region: string;
  sessions: number;
  sets: number;
  volumeKg: number;
  deltaVolumeKg: number;
  deltaPercent: number | null;
};

type WorkoutSummary = {
  today: WorkoutSnapshot;
  yesterday: WorkoutSnapshot;
  thisWeek: WorkoutSnapshot;
  lastWeek: WorkoutSnapshot;
  deltas: {
    sessions: string;
    duration: string;
    volumeKg: string;
  };
  muscleGroups: {
    thisWeek: MuscleGroupTrend[];
    totalVolumeKg: number;
    totalSets: number;
  };
};

const bodyRegionOptions = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Sports",
  "Mobility",
  "Full Body",
  "Other",
];

const intensityOptions: WorkoutIntensity[] = ["Low", "Medium", "High", "Max"];

const selectClassName =
  "w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text outline-none transition focus:border-app-primary focus:ring-4 focus:ring-app-primary/15";

const emptySummary: WorkoutSummary = {
  today: { sessions: 0, exercises: 0, sets: 0, durationMinutes: 0, volumeKg: 0 },
  yesterday: { sessions: 0, exercises: 0, sets: 0, durationMinutes: 0, volumeKg: 0 },
  thisWeek: { sessions: 0, exercises: 0, sets: 0, durationMinutes: 0, volumeKg: 0 },
  lastWeek: { sessions: 0, exercises: 0, sets: 0, durationMinutes: 0, volumeKg: 0 },
  deltas: { sessions: "No change vs yesterday", duration: "No change vs yesterday", volumeKg: "No change vs yesterday" },
  muscleGroups: { thisWeek: [], totalVolumeKg: 0, totalSets: 0 },
};

function createExerciseId() {
  return `exercise-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyExercise(): ExerciseForm {
  return {
    id: createExerciseId(),
    name: "",
    bodyRegion: "Other",
    sets: "",
    reps: "",
    weightLifted: "",
    restSeconds: "",
  };
}

const initialForm: WorkoutForm = {
  focus: "",
  durationMinutes: "",
  intensity: "Medium",
  exercises: [createEmptyExercise()],
};

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getWorkoutExercises(workout: WorkoutLog): WorkoutExercise[] {
  if (Array.isArray(workout.exercises) && workout.exercises.length > 0) {
    return workout.exercises;
  }

  return [
    {
      name: workout.focus || "Workout",
      bodyRegion: workout.bodyRegion || "Other",
      sets: workout.sets || 0,
      reps: workout.reps || 0,
      weightLifted: workout.weightLifted || 0,
    },
  ];
}

function getSessionVolumeKg(workout: WorkoutLog) {
  if (typeof workout.totalLoadKg === "number" && workout.totalLoadKg >= 0) {
    return workout.totalLoadKg;
  }

  const exercises = getWorkoutExercises(workout);
  return round(
    exercises.reduce((volume, exercise) => {
      return volume + (exercise.sets || 0) * (exercise.reps || 0) * (exercise.weightLifted || 0);
    }, 0)
  );
}

function toExerciseForm(exercise: WorkoutExercise): ExerciseForm {
  return {
    id: createExerciseId(),
    name: exercise.name || "",
    bodyRegion: exercise.bodyRegion || "Other",
    sets: exercise.sets ? String(exercise.sets) : "",
    reps: exercise.reps ? String(exercise.reps) : "",
    weightLifted: String(exercise.weightLifted ?? 0),
    restSeconds: exercise.restSeconds ? String(exercise.restSeconds) : "",
  };
}

function toForm(item: WorkoutLog): WorkoutForm {
  const exercises = getWorkoutExercises(item).map(toExerciseForm);
  return {
    focus: item.focus || "",
    durationMinutes: item.durationMinutes ? String(item.durationMinutes) : "",
    intensity: intensityOptions.includes(item.intensity) ? item.intensity : "Medium",
    exercises: exercises.length > 0 ? exercises : [createEmptyExercise()],
  };
}

function getIntensityPillClass(intensity: string) {
  switch (intensity) {
    case "High":
      return "bg-amber-300/25 text-amber-200 ring-amber-300/40";
    case "Max":
      return "bg-rose-400/20 text-rose-200 ring-rose-400/40";
    case "Low":
      return "bg-cyan-300/20 text-cyan-100 ring-cyan-300/30";
    default:
      return "bg-app-primary/25 text-app-primary-strong ring-app-primary/35";
  }
}

export default function WorkoutPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState<WorkoutForm>(initialForm);
  const [items, setItems] = useState<WorkoutLog[]>([]);
  const [summary, setSummary] = useState<WorkoutSummary>(emptySummary);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedItem, setDeletedItem] = useState<WorkoutLog | null>(null);
  const [searchText, setSearchText] = useState("");
  const [intensityFilter, setIntensityFilter] = useState<"All" | WorkoutIntensity>("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadWorkoutData = useCallback(async () => {
    const [listResponse, summaryResponse] = await Promise.all([workoutApi.list(), workoutApi.summary()]);
    const rows = Array.isArray(listResponse.data) ? listResponse.data : [];
    setItems(
      rows.map((entry: WorkoutLog) => ({
        id: entry.id,
        focus: entry.focus ?? "Workout session",
        bodyRegion: entry.bodyRegion ?? "Other",
        sets: entry.sets ?? 0,
        reps: entry.reps ?? 0,
        weightLifted: entry.weightLifted ?? 0,
        totalLoadKg: entry.totalLoadKg ?? getSessionVolumeKg(entry),
        durationMinutes: entry.durationMinutes ?? 0,
        intensity: intensityOptions.includes(entry.intensity) ? entry.intensity : "Medium",
        createdAt: entry.createdAt,
        loggedAt: entry.loggedAt,
        exercises: Array.isArray(entry.exercises) ? entry.exercises : undefined,
      }))
    );
    setSummary(summaryResponse.data as WorkoutSummary);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadWorkoutData();
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void load();
  }, [loadWorkoutData]);

  function updateExercise(exerciseId: string, updater: (exercise: ExerciseForm) => ExerciseForm) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)),
    }));
  }

  function handleAddExercise() {
    setForm((current) => ({
      ...current,
      exercises: [...current.exercises, createEmptyExercise()],
    }));
  }

  function handleRemoveExercise(exerciseId: string) {
    setForm((current) => {
      if (current.exercises.length <= 1) {
        return {
          ...current,
          exercises: [createEmptyExercise()],
        };
      }

      return {
        ...current,
        exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
      };
    });
  }

  function resetForm() {
    setForm({
      ...initialForm,
      exercises: [createEmptyExercise()],
    });
  }

  function buildExercisePayload() {
    const payload = [];

    for (let index = 0; index < form.exercises.length; index += 1) {
      const exercise = form.exercises[index];
      const exerciseLabel = `Exercise ${index + 1}`;

      if (!exercise.name.trim()) {
        pushToast(`${exerciseLabel}: name is required.`, "error");
        return null;
      }
      if (!isPositiveNumber(exercise.sets) || !Number.isInteger(Number(exercise.sets))) {
        pushToast(`${exerciseLabel}: sets must be a positive whole number.`, "error");
        return null;
      }
      if (!isPositiveNumber(exercise.reps) || !Number.isInteger(Number(exercise.reps))) {
        pushToast(`${exerciseLabel}: reps must be a positive whole number.`, "error");
        return null;
      }
      if (exercise.weightLifted.trim() === "" || Number(exercise.weightLifted) < 0 || Number.isNaN(Number(exercise.weightLifted))) {
        pushToast(`${exerciseLabel}: weight must be zero or more.`, "error");
        return null;
      }

      const restSeconds = parseOptionalNumber(exercise.restSeconds);
      if (restSeconds !== undefined && (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 1800)) {
        pushToast(`${exerciseLabel}: rest must be an integer between 0 and 1800 seconds.`, "error");
        return null;
      }

      payload.push({
        name: exercise.name.trim(),
        bodyRegion: exercise.bodyRegion || "Other",
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weightLifted: Number(exercise.weightLifted),
        ...(restSeconds !== undefined ? { restSeconds } : {}),
      });
    }

    if (payload.length === 0) {
      pushToast("Add at least one exercise to save this workout session.", "error");
      return null;
    }

    return payload;
  }

  async function handleSubmit() {
    if (!form.focus.trim()) {
      pushToast("Enter a workout session title before saving.", "error");
      return;
    }

    const exercises = buildExercisePayload();
    if (!exercises) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        focus: form.focus.trim(),
        durationMinutes: parseOptionalNumber(form.durationMinutes),
        intensity: form.intensity,
        exercises,
      };

      if (editingId) {
        await workoutApi.update(editingId, payload);
        pushToast("Workout session updated.", "success");
      } else {
        await workoutApi.create(payload);
        pushToast("Workout session logged.", "success");
      }

      await loadWorkoutData();
      resetForm();
      setEditingId(null);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not save workout session."), "error");
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
    resetForm();
  }

  async function handleDelete(item: WorkoutLog) {
    try {
      await workoutApi.remove(item.id);
      setDeletedItem(item);
      pushToast("Workout session deleted. You can undo this.", "info");
      await loadWorkoutData();
      if (editingId === item.id) {
        handleCancelEdit();
      }
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not delete workout session."), "error");
    }
  }

  async function handleUndoDelete() {
    if (!deletedItem) {
      return;
    }

    setIsUndoing(true);
    try {
      await workoutApi.create({
        focus: deletedItem.focus,
        ...(deletedItem.durationMinutes > 0 ? { durationMinutes: deletedItem.durationMinutes } : {}),
        intensity: deletedItem.intensity,
        exercises: getWorkoutExercises(deletedItem),
      });
      setDeletedItem(null);
      pushToast("Workout session restored.", "success");
      await loadWorkoutData();
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not restore workout session."), "error");
    } finally {
      setIsUndoing(false);
    }
  }

  const filteredItems = items.filter((workout) => {
    if (intensityFilter !== "All" && workout.intensity !== intensityFilter) {
      return false;
    }

    if (!searchText.trim()) {
      return true;
    }

    const query = searchText.toLowerCase();
    const exerciseNames = getWorkoutExercises(workout)
      .map((exercise) => exercise.name.toLowerCase())
      .join(" ");

    return workout.focus.toLowerCase().includes(query) || exerciseNames.includes(query);
  });

  const maxMuscleGroupVolume = summary.muscleGroups.thisWeek.reduce((maxVolume, entry) => {
    return Math.max(maxVolume, entry.volumeKg);
  }, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Workout tracker"
        title="Build full training sessions, then analyze muscle-group volume week by week."
        description="Session Builder lets you log multiple exercises in one workout. Analytics now show today vs yesterday momentum and this-week muscle-group load."
        badge={editingId ? "Editing session" : "Session Builder live"}
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

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">{editingId ? "Edit session" : "Create session"}</h3>
          <div className="mt-5 grid gap-4">
            <Input
              placeholder="Session title (e.g. Upper Body Strength)"
              value={form.focus}
              onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Duration (minutes)"
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
              />
              <select
                className={selectClassName}
                value={form.intensity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, intensity: (event.target.value as WorkoutIntensity) || "Medium" }))
                }
              >
                {intensityOptions.map((intensity) => (
                  <option key={intensity} value={intensity}>
                    {intensity} intensity
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-app-border/70 bg-app-surface-strong/35 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-app-text">Exercises</p>
                <Button type="button" variant="ghost" onClick={handleAddExercise}>
                  Add exercise
                </Button>
              </div>

              <div className="grid gap-3">
                {form.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="rounded-2xl border border-app-border/60 bg-app-surface/55 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-text-soft">
                        Exercise {index + 1}
                      </p>
                      <Button type="button" variant="ghost" onClick={() => handleRemoveExercise(exercise.id)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={(event) =>
                          updateExercise(exercise.id, (current) => ({ ...current, name: event.target.value }))
                        }
                      />
                      <select
                        className={selectClassName}
                        value={exercise.bodyRegion}
                        onChange={(event) =>
                          updateExercise(exercise.id, (current) => ({ ...current, bodyRegion: event.target.value }))
                        }
                      >
                        {bodyRegionOptions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        type="number"
                        placeholder="Sets"
                        value={exercise.sets}
                        onChange={(event) =>
                          updateExercise(exercise.id, (current) => ({ ...current, sets: event.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={exercise.reps}
                        onChange={(event) =>
                          updateExercise(exercise.id, (current) => ({ ...current, reps: event.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Weight (kg)"
                        value={exercise.weightLifted}
                        onChange={(event) =>
                          updateExercise(exercise.id, (current) => ({ ...current, weightLifted: event.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Rest (sec)"
                        value={exercise.restSeconds}
                        onChange={(event) =>
                          updateExercise(exercise.id, (current) => ({ ...current, restSeconds: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingId ? "Update workout session" : "Log workout session"}
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
          <h3 className="text-xl font-semibold text-app-text">Workout analytics</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-app-surface-strong p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-app-text-soft">Today sessions</p>
              <p className="mt-2 text-2xl font-bold text-app-text">{summary.today.sessions}</p>
              <p className="mt-1 text-xs text-app-text-soft">{summary.deltas.sessions}</p>
            </div>
            <div className="rounded-2xl bg-app-surface-strong p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-app-text-soft">Today volume</p>
              <p className="mt-2 text-2xl font-bold text-app-text">{summary.today.volumeKg} kg</p>
              <p className="mt-1 text-xs text-app-text-soft">{summary.deltas.volumeKg}</p>
            </div>
            <div className="rounded-2xl bg-app-surface-strong p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-app-text-soft">This week sets</p>
              <p className="mt-2 text-2xl font-bold text-app-text">{summary.thisWeek.sets}</p>
              <p className="mt-1 text-xs text-app-text-soft">Across {summary.thisWeek.exercises} exercises</p>
            </div>
            <div className="rounded-2xl bg-app-surface-strong p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-app-text-soft">This week duration</p>
              <p className="mt-2 text-2xl font-bold text-app-text">{summary.thisWeek.durationMinutes} min</p>
              <p className="mt-1 text-xs text-app-text-soft">{summary.deltas.duration}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-app-surface-strong p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-app-text-soft">Muscle-group analytics</p>
                <p className="mt-1 text-sm text-app-text-soft">
                  This week: {summary.muscleGroups.totalSets} sets · {summary.muscleGroups.totalVolumeKg} kg total load
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              {summary.muscleGroups.thisWeek.length === 0 ? (
                <div className="rounded-2xl bg-app-surface p-4 text-sm text-app-text-soft">
                  No muscle-group data yet. Log your first session to see weekly distribution.
                </div>
              ) : (
                summary.muscleGroups.thisWeek.slice(0, 7).map((entry) => {
                  const progress = maxMuscleGroupVolume > 0 ? (entry.volumeKg / maxMuscleGroupVolume) * 100 : 0;
                  return (
                    <div key={entry.region}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-app-text">{entry.region}</p>
                          <p className="text-xs text-app-text-soft">
                            {entry.sets} sets · {entry.sessions} sessions
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-semibold text-app-text">{entry.volumeKg} kg</p>
                          <p className={entry.deltaVolumeKg >= 0 ? "text-emerald-300" : "text-rose-300"}>
                            {entry.deltaVolumeKg >= 0 ? "+" : ""}
                            {entry.deltaVolumeKg} kg
                            {entry.deltaPercent !== null ? ` (${entry.deltaPercent >= 0 ? "+" : ""}${entry.deltaPercent}%)` : " (n/a)"}
                          </p>
                        </div>
                      </div>
                      <ProgressBar value={progress} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-xl font-semibold text-app-text">Recent sessions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Search session or exercise"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <select
                className={selectClassName}
                value={intensityFilter}
                onChange={(event) =>
                  setIntensityFilter((event.target.value as "All" | WorkoutIntensity) || "All")
                }
              >
                <option value="All">All intensities</option>
                {intensityOptions.map((intensity) => (
                  <option key={intensity} value={intensity}>
                    {intensity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No workouts match your filters yet.
              </div>
            ) : (
              filteredItems.map((workout) => {
                const exercises = getWorkoutExercises(workout);
                const sessionVolume = getSessionVolumeKg(workout);
                const loggedDate = workout.loggedAt || workout.createdAt;
                return (
                  <div key={workout.id} className="rounded-3xl bg-app-surface-strong p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold text-app-text">{workout.focus}</h4>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getIntensityPillClass(workout.intensity)}`}
                          >
                            {workout.intensity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-app-text-soft">
                          {exercises.length} exercises · {workout.sets} sets · {workout.durationMinutes || 0} min ·{" "}
                          {sessionVolume} kg load
                        </p>
                        {loggedDate ? (
                          <p className="mt-1 text-xs text-app-text-soft">
                            Logged on {new Date(loggedDate).toLocaleDateString("en-IN")}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-app-text-soft">
                          {exercises
                            .slice(0, 4)
                            .map((exercise) => `${exercise.name} (${exercise.sets}x${exercise.reps})`)
                            .join(" • ")}
                          {exercises.length > 4 ? " • ..." : ""}
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
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
