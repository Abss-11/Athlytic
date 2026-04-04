import { useEffect, useState } from "react";
import axios from "axios";
import { goalApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { isPositiveNumber } from "../lib/validation";

export default function GoalsPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    title: "",
    targetValue: "",
    deadline: "",
  });
  const [items, setItems] = useState<
    { id: string; title: string; current: string; target: string; progress: number }[]
  >([]);

  useEffect(() => {
    async function loadGoals() {
      try {
        const response = await goalApi.list();
        setItems(
          response.data.goals.map((goal: { id: string; title: string; currentValue: number; targetValue: number; unit: string }) => ({
            id: goal.id,
            title: goal.title,
            current: `${goal.currentValue}${goal.unit}`,
            target: `${goal.targetValue}${goal.unit}`,
            progress: Math.round((goal.currentValue / goal.targetValue) * 100),
          }))
        );
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadGoals();
  }, []);

  async function handleSubmit() {
    if (!form.title.trim() || !isPositiveNumber(form.targetValue)) {
      pushToast("Enter a goal name and a valid target value.", "error");
      return;
    }

    const payload = {
      athleteId: "ath-1",
      title: form.title,
      category: "strength",
      targetValue: Number(form.targetValue),
      currentValue: 0,
      unit: "kg",
      deadline: form.deadline,
    };

    const response = await goalApi.create(payload);
    setItems((current) => [
      {
        id: response.data.id,
        title: response.data.title,
        current: `0${response.data.unit}`,
        target: `${response.data.targetValue}${response.data.unit}`,
        progress: 0,
      },
      ...current,
    ]);
    setForm({ title: "", targetValue: "", deadline: "" });
    pushToast("Goal created successfully.", "success");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Goal tracking"
        title="Build measurable targets around nutrition, strength, body composition, and training volume."
        description="Set goals for protein, calories, gym frequency, running distance, body weight, and strength targets with visual progress indicators."
        badge="6 active goals"
      />

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Create a goal</h3>
          <div className="mt-5 grid gap-4">
            <Input placeholder="Goal name" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <Input
              placeholder="Target value"
              value={form.targetValue}
              onChange={(event) => setForm((current) => ({ ...current, targetValue: event.target.value }))}
            />
            <Input placeholder="Deadline" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} />
            <Button type="button" onClick={handleSubmit}>
              Create goal
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Active goals</h3>
          <div className="mt-5 grid gap-5">
            {items.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No goals created yet. Add your first target to begin tracking progress.
              </div>
            ) : (
              items.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-app-text">{goal.title}</p>
                      <p className="text-sm text-app-text-soft">
                        {goal.current} of {goal.target}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-app-text">{goal.progress}%</span>
                  </div>
                  <ProgressBar value={goal.progress} />
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
