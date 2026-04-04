import { useEffect, useState } from "react";
import axios from "axios";
import { workoutApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { isPositiveNumber } from "../lib/validation";

export default function WorkoutPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    focus: "",
    sets: "",
    reps: "",
    weightLifted: "",
    durationMinutes: "",
  });
  const [items, setItems] = useState<
    { id: string; focus: string; volume: string; duration: string; intensity: string }[]
  >([]);

  useEffect(() => {
    async function loadWorkouts() {
      try {
        const response = await workoutApi.list();
        setItems(
          response.data.map(
            (entry: {
              id: string;
              focus: string;
              sets?: number;
              reps?: number;
              durationMinutes?: number;
              intensity?: string;
            }) => ({
              id: entry.id,
              focus: entry.focus,
              volume: `${entry.sets ?? 0} sets · ${entry.reps ?? 0} reps`,
              duration: `${entry.durationMinutes ?? 0} min`,
              intensity: entry.intensity ?? "Medium",
            })
          )
        );
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadWorkouts();
  }, []);

  async function handleSubmit() {
    if (!form.focus.trim() || !isPositiveNumber(form.sets) || !isPositiveNumber(form.reps)) {
      pushToast("Enter a workout focus with valid sets and reps.", "error");
      return;
    }

    const payload = {
      athleteId: "ath-1",
      focus: form.focus,
      sets: Number(form.sets),
      reps: Number(form.reps),
      weightLifted: Number(form.weightLifted),
      durationMinutes: Number(form.durationMinutes),
      intensity: "Medium",
    };

    const response = await workoutApi.create(payload);
    setItems((current) => [
      {
        id: response.data.id,
        focus: response.data.focus,
        volume: `${response.data.sets} sets · ${response.data.reps} reps`,
        duration: `${response.data.durationMinutes} min`,
        intensity: response.data.intensity,
      },
      ...current,
    ]);
    setForm({ focus: "", sets: "", reps: "", weightLifted: "", durationMinutes: "" });
    pushToast("Workout logged successfully.", "success");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workout tracker"
        title="Capture lifting, sports training, and session quality in seconds."
        description="Log chest, back, legs, shoulders, arms, core, and sports sessions with sets, reps, weight, duration, and strength progression."
        badge="Strength graphs enabled"
      />

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Add workout</h3>
          <div className="mt-5 grid gap-4">
            <Input placeholder="Workout focus" value={form.focus} onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Sets" value={form.sets} onChange={(event) => setForm((current) => ({ ...current, sets: event.target.value }))} />
              <Input placeholder="Reps" value={form.reps} onChange={(event) => setForm((current) => ({ ...current, reps: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Weight lifted"
                value={form.weightLifted}
                onChange={(event) => setForm((current) => ({ ...current, weightLifted: event.target.value }))}
              />
              <Input
                placeholder="Duration"
                value={form.durationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
              />
            </div>
            <Button type="button" onClick={handleSubmit}>
              Log training session
            </Button>
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
                      <p className="mt-1 text-sm text-app-text-soft">{workout.volume}</p>
                    </div>
                    <div className="text-sm text-app-text-soft">
                      {workout.duration} · {workout.intensity}
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
