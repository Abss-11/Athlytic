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
    { label: "Protein", consumed: 0, target: 170, unit: "g" },
    { label: "Carbs", consumed: 0, target: 250, unit: "g" },
    { label: "Fats", consumed: 0, target: 75, unit: "g" },
    { label: "Water", consumed: 0, target: 3.5, unit: "L" },
  ]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await nutritionApi.list();
        const totals = response.data.reduce(
          (
            acc: { protein: number; carbs: number; fats: number; calories: number; waterLiters: number },
            entry: { protein: number; carbs: number; fats: number; calories: number; waterLiters?: number }
          ) => ({
            protein: acc.protein + (entry.protein || 0),
            carbs: acc.carbs + (entry.carbs || 0),
            fats: acc.fats + (entry.fats || 0),
            calories: acc.calories + (entry.calories || 0),
            waterLiters: acc.waterLiters + (entry.waterLiters || 0),
          }),
          { protein: 0, carbs: 0, fats: 0, calories: 0, waterLiters: 0 }
        );

        setEntries([
          { label: "Protein", consumed: totals.protein, target: 170, unit: "g" },
          { label: "Carbs", consumed: totals.carbs, target: 250, unit: "g" },
          { label: "Fats", consumed: totals.fats, target: 75, unit: "g" },
          { label: "Water", consumed: Number(totals.waterLiters.toFixed(1)), target: 3.5, unit: "L" },
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
      athleteId: "ath-1",
      mealName: form.mealName,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fats: Number(form.fats),
      waterLiters: 0,
    };

    await nutritionApi.create(payload);
    setEntries((current) =>
      current.map((entry) => {
        if (entry.label === "Protein") return { ...entry, consumed: entry.consumed + payload.protein };
        if (entry.label === "Carbs") return { ...entry, consumed: entry.consumed + payload.carbs };
        if (entry.label === "Fats") return { ...entry, consumed: entry.consumed + payload.fats };
        return entry;
      })
    );
    setForm({ mealName: "", calories: "", protein: "", carbs: "", fats: "" });
    pushToast("Nutrition entry saved.", "success");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nutrition tracker"
        title="Log meals, monitor macros, and keep your fueling aligned with performance."
        description="Track protein, carbs, fats, calories, and hydration while generating weekly nutrition reports and macro progress graphs."
        badge="Food database live"
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
    </div>
  );
}
