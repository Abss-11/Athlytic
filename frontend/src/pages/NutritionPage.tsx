import { useEffect, useState } from "react";
import axios from "axios";
import { nutritionApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { isPositiveNumber } from "../lib/validation";

export default function NutritionPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    mealName: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });
  const [entries, setEntries] = useState([
    { label: "Protein", consumed: 0, target: 170, yesterday: 0, unit: "g" },
    { label: "Carbs", consumed: 0, target: 250, yesterday: 0, unit: "g" },
    { label: "Fats", consumed: 0, target: 75, yesterday: 0, unit: "g" },
    { label: "Water", consumed: 0, target: 3.5, yesterday: 0, unit: "L" },
  ]);
  const [aiAdvice, setAiAdvice] = useState<string[]>([]);
  const [dietSuggestions, setDietSuggestions] = useState<string[]>([]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await nutritionApi.summary();
        const summary = response.data;
        setAiAdvice(summary.recommendations?.aiAdvice || []);
        setDietSuggestions(summary.recommendations?.dietSuggestions || []);
        setEntries([
          {
            label: "Protein",
            consumed: summary.today.protein,
            target: summary.targets.protein,
            yesterday: summary.yesterday.protein,
            unit: "g",
          },
          {
            label: "Carbs",
            consumed: summary.today.carbs,
            target: summary.targets.carbs,
            yesterday: summary.yesterday.carbs,
            unit: "g",
          },
          {
            label: "Fats",
            consumed: summary.today.fats,
            target: summary.targets.fats,
            yesterday: summary.yesterday.fats,
            unit: "g",
          },
          {
            label: "Water",
            consumed: summary.today.waterLiters,
            target: summary.targets.waterLiters,
            yesterday: summary.yesterday.waterLiters,
            unit: "L",
          },
        ]);
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadEntries();
  }, []);

  async function handleSubmit() {
    if (!form.mealName.trim() || !isPositiveNumber(form.calories) || !isPositiveNumber(form.protein)) {
      pushToast("Add a meal name plus valid calorie and protein values.", "error");
      return;
    }

    const payload = {
      mealName: form.mealName,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fats: Number(form.fats),
      waterLiters: 0,
    };

    await nutritionApi.create(payload);
    const summaryResponse = await nutritionApi.summary();
    const summary = summaryResponse.data;
    setAiAdvice(summary.recommendations?.aiAdvice || []);
    setDietSuggestions(summary.recommendations?.dietSuggestions || []);
    setEntries([
      {
        label: "Protein",
        consumed: summary.today.protein,
        target: summary.targets.protein,
        yesterday: summary.yesterday.protein,
        unit: "g",
      },
      {
        label: "Carbs",
        consumed: summary.today.carbs,
        target: summary.targets.carbs,
        yesterday: summary.yesterday.carbs,
        unit: "g",
      },
      {
        label: "Fats",
        consumed: summary.today.fats,
        target: summary.targets.fats,
        yesterday: summary.yesterday.fats,
        unit: "g",
      },
      {
        label: "Water",
        consumed: summary.today.waterLiters,
        target: summary.targets.waterLiters,
        yesterday: summary.yesterday.waterLiters,
        unit: "L",
      },
    ]);
    setForm({ mealName: "", calories: "", protein: "", carbs: "", fats: "" });
    pushToast("Nutrition entry saved.", "success");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nutrition tracker"
        title="Log meals, monitor macros, and keep your fueling aligned with performance."
        description="Macros now reset daily and compare against yesterday so every day starts from zero and tracks independently."
        badge="Today vs yesterday"
      />

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Log a meal</h3>
          <div className="mt-5 grid gap-4">
            <Input placeholder="Meal name" value={form.mealName} onChange={(event) => setForm((current) => ({ ...current, mealName: event.target.value }))} />
            <Input placeholder="Calories" value={form.calories} onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))} />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Protein" value={form.protein} onChange={(event) => setForm((current) => ({ ...current, protein: event.target.value }))} />
              <Input placeholder="Carbs" value={form.carbs} onChange={(event) => setForm((current) => ({ ...current, carbs: event.target.value }))} />
              <Input placeholder="Fats" value={form.fats} onChange={(event) => setForm((current) => ({ ...current, fats: event.target.value }))} />
            </div>
            <Button variant="secondary" onClick={handleSubmit} type="button">
              Save nutrition entry
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Macro progress</h3>
          <div className="mt-5 grid gap-5">
            {entries.map((macro) => {
              const value = (macro.consumed / macro.target) * 100;
              const diff = macro.consumed - macro.yesterday;
              return (
                <div key={macro.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-app-text">{macro.label}</p>
                      <p className="text-sm text-app-text-soft">
                        {macro.consumed}
                        {macro.unit} / {macro.target}
                        {macro.unit}
                      </p>
                      <p className="text-xs text-app-text-soft">
                        Yesterday: {macro.yesterday}
                        {macro.unit} ({diff > 0 ? `+${diff}` : diff}
                        {macro.unit})
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-app-text">{Math.round(value)}%</span>
                  </div>
                  <ProgressBar value={value} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">AI nutrition guidance</h3>
          <div className="mt-5 grid gap-3">
            {aiAdvice.length === 0 ? (
              <p className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                Add profile metrics to unlock personalized nutrition guidance.
              </p>
            ) : (
              aiAdvice.map((tip) => (
                <div key={tip} className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text">
                  {tip}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Suggested diet plan</h3>
          <div className="mt-5 grid gap-3">
            {dietSuggestions.length === 0 ? (
              <p className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                Diet suggestions will appear after profile personalization.
              </p>
            ) : (
              dietSuggestions.map((line) => (
                <div key={line} className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  {line}
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
