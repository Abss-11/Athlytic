import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { nutritionApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { extractApiErrorMessage, isPositiveNumber } from "../lib/validation";

type NutritionEntry = {
  id: string;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterLiters: number;
};

type NutritionFormState = {
  mealName: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
};

const initialForm: NutritionFormState = {
  mealName: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
};

function toForm(entry: NutritionEntry): NutritionFormState {
  return {
    mealName: entry.mealName,
    calories: String(entry.calories ?? 0),
    protein: String(entry.protein ?? 0),
    carbs: String(entry.carbs ?? 0),
    fats: String(entry.fats ?? 0),
  };
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function NutritionPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState<NutritionFormState>(initialForm);
  const [entries, setEntries] = useState([
    { label: "Protein", consumed: 0, target: 170, yesterday: 0, unit: "g" },
    { label: "Carbs", consumed: 0, target: 250, yesterday: 0, unit: "g" },
    { label: "Fats", consumed: 0, target: 75, yesterday: 0, unit: "g" },
    { label: "Water", consumed: 0, target: 3.5, yesterday: 0, unit: "L" },
  ]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletedEntry, setDeletedEntry] = useState<NutritionEntry | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string[]>([]);
  const [dietSuggestions, setDietSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadNutritionData = useCallback(async () => {
    const [summaryResponse, logsResponse] = await Promise.all([nutritionApi.summary(), nutritionApi.list()]);
    const summary = summaryResponse.data;
    const logs = Array.isArray(logsResponse.data) ? logsResponse.data : [];

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
    setNutritionLogs(
      logs.map((entry: NutritionEntry) => ({
        id: entry.id,
        mealName: entry.mealName,
        calories: entry.calories ?? 0,
        protein: entry.protein ?? 0,
        carbs: entry.carbs ?? 0,
        fats: entry.fats ?? 0,
        waterLiters: entry.waterLiters ?? 0,
      }))
    );
  }, []);

  useEffect(() => {
    async function loadEntries() {
      try {
        await loadNutritionData();
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadEntries();
  }, [loadNutritionData]);

  async function handleSubmit() {
    if (!form.mealName.trim() || !isPositiveNumber(form.calories) || !isPositiveNumber(form.protein)) {
      pushToast("Add a meal name plus valid calorie and protein values.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        mealName: form.mealName.trim(),
        calories: parseNumber(form.calories),
        protein: parseNumber(form.protein),
        carbs: parseNumber(form.carbs),
        fats: parseNumber(form.fats),
        waterLiters: 0,
      };

      if (editingId) {
        await nutritionApi.update(editingId, payload);
        pushToast("Nutrition entry updated.", "success");
      } else {
        await nutritionApi.create(payload);
        pushToast("Nutrition entry saved.", "success");
      }

      await loadNutritionData();
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not save nutrition entry."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(entry: NutritionEntry) {
    setEditingId(entry.id);
    setForm(toForm(entry));
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleDelete(entry: NutritionEntry) {
    try {
      await nutritionApi.remove(entry.id);
      setDeletedEntry(entry);
      pushToast("Nutrition entry deleted. You can undo this.", "info");
      await loadNutritionData();
      if (editingId === entry.id) {
        handleCancelEdit();
      }
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not delete nutrition entry."), "error");
    }
  }

  async function handleUndoDelete() {
    if (!deletedEntry) {
      return;
    }

    setIsUndoing(true);
    try {
      await nutritionApi.create({
        mealName: deletedEntry.mealName,
        calories: deletedEntry.calories,
        protein: deletedEntry.protein,
        carbs: deletedEntry.carbs,
        fats: deletedEntry.fats,
        waterLiters: deletedEntry.waterLiters,
      });
      pushToast("Nutrition entry restored.", "success");
      setDeletedEntry(null);
      await loadNutritionData();
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not restore nutrition entry."), "error");
    } finally {
      setIsUndoing(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nutrition tracker"
        title="Log meals, monitor macros, and keep your fueling aligned with performance."
        description="Macros reset daily and compare against yesterday. You can now edit, delete, and undo nutrition logs."
        badge={editingId ? "Editing entry" : "Today vs yesterday"}
      />

      {deletedEntry ? (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-app-text-soft">
              Deleted: <span className="font-semibold text-app-text">{deletedEntry.mealName}</span>
            </p>
            <Button type="button" variant="secondary" disabled={isUndoing} onClick={handleUndoDelete}>
              {isUndoing ? "Restoring..." : "Undo delete"}
            </Button>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">{editingId ? "Edit meal" : "Log a meal"}</h3>
          <div className="mt-5 grid gap-4">
            <Input
              placeholder="Meal name"
              value={form.mealName}
              onChange={(event) => setForm((current) => ({ ...current, mealName: event.target.value }))}
            />
            <Input
              placeholder="Calories"
              value={form.calories}
              onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Protein"
                value={form.protein}
                onChange={(event) => setForm((current) => ({ ...current, protein: event.target.value }))}
              />
              <Input
                placeholder="Carbs"
                value={form.carbs}
                onChange={(event) => setForm((current) => ({ ...current, carbs: event.target.value }))}
              />
              <Input
                placeholder="Fats"
                value={form.fats}
                onChange={(event) => setForm((current) => ({ ...current, fats: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleSubmit} type="button" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingId ? "Update nutrition entry" : "Save nutrition entry"}
              </Button>
              {editingId ? (
                <Button variant="ghost" onClick={handleCancelEdit} type="button">
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-app-text">Macro progress</h3>
          <div className="mt-5 grid gap-5">
            {entries.map((macro) => {
              const value = macro.target > 0 ? (macro.consumed / macro.target) * 100 : 0;
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

      <section className="mt-6">
        <Card>
          <h3 className="text-xl font-semibold text-app-text">Today&apos;s nutrition log</h3>
          <div className="mt-5 grid gap-3">
            {nutritionLogs.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No nutrition entries yet. Add your first meal above.
              </div>
            ) : (
              nutritionLogs.map((entry) => (
                <div key={entry.id} className="rounded-3xl bg-app-surface-strong p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-app-text">{entry.mealName}</h4>
                      <p className="mt-1 text-sm text-app-text-soft">
                        {entry.calories} kcal · {entry.protein}P / {entry.carbs}C / {entry.fats}F
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => handleEdit(entry)}>
                        Edit
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => handleDelete(entry)}>
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
