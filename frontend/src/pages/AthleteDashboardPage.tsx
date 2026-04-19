import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { dashboardApi, sleepApi } from "../api/api";
import BarChartCard from "../components/charts/BarChartCard";
import LineChartCard from "../components/charts/LineChartCard";
import StatCard from "../components/dashboard/StatCard";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import ProgressBar from "../components/ui/ProgressBar";
import ProgressRing from "../components/ui/ProgressRing";
import { useToast } from "../context/ToastContext";
import { extractApiErrorMessage, isPositiveNumber } from "../lib/validation";
import type { StatCardData } from "../types";

type ChartState = {
  labels: string[];
  datasets: any[];
};

type SleepEntry = {
  id: string;
  hours: number;
  note: string;
  createdAt?: string;
};

export default function AthleteDashboardPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [stats, setStats] = useState<StatCardData[]>([
    { label: "Protein intake", value: "0g / 170g", delta: "No meals logged yet", tone: "neutral" },
    { label: "Calories", value: "0 kcal", delta: "0% of target", tone: "neutral" },
    { label: "Sleep quality", value: "0 hrs", delta: "No sleep data yet", tone: "neutral" },
    { label: "Performance score", value: "0 / 100", delta: "Start tracking to build your score", tone: "neutral" },
    { label: "Readiness score", value: "0 / 100", delta: "Start tracking to view recovery", tone: "neutral" },
  ]);
  const [insights, setInsights] = useState<string[]>([]);
  const [goalItems, setGoalItems] = useState<
    { id: string; title: string; current: string; target: string; progress: number }[]
  >([]);
  const [nutritionItems, setNutritionItems] = useState<
    { meal: string; calories: number; macros: string }[]
  >([]);
  const [workoutChartData, setWorkoutChartData] = useState<ChartState>({ labels: [], datasets: [] });
  const [nutritionChartData, setNutritionChartData] = useState<ChartState>({ labels: [], datasets: [] });
  const [runningChartData, setRunningChartData] = useState<ChartState>({ labels: [], datasets: [] });
  const [strengthChartData, setStrengthChartData] = useState<ChartState>({ labels: [], datasets: [] });
  const [performanceScore, setPerformanceScore] = useState(0);
  const [sleepHoursInput, setSleepHoursInput] = useState("");
  const [sleepNoteInput, setSleepNoteInput] = useState("");
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>([]);
  const [editingSleepId, setEditingSleepId] = useState<string | null>(null);
  const [deletedSleepEntry, setDeletedSleepEntry] = useState<SleepEntry | null>(null);
  const [sleepDayInfo, setSleepDayInfo] = useState({ today: 0, yesterday: 0, target: 8 });
  const [isSavingSleep, setIsSavingSleep] = useState(false);
  const [isUndoingSleep, setIsUndoingSleep] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [todayPlan, setTodayPlan] = useState({
    caloriesLeft: 0,
    proteinLeft: 0,
    carbsLeft: 0,
    fatsLeft: 0,
    waterLeft: 0,
    caloriesTarget: 0,
    proteinTarget: 0,
    carbsTarget: 0,
    fatsTarget: 0,
    waterTarget: 0,
  });

  function getRemaining(target: number, current: number) {
    return Math.max(0, Math.round((target - current + Number.EPSILON) * 10) / 10);
  }

  const loadSleepLogs = useCallback(async () => {
    const response = await sleepApi.list();
    const rows = Array.isArray(response.data) ? response.data : [];
    setSleepLogs(
      rows.map((entry: SleepEntry) => ({
        id: entry.id,
        hours: entry.hours ?? 0,
        note: entry.note ?? "",
        createdAt: entry.createdAt,
      }))
    );
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await dashboardApi.getAthleteDashboard();
      const data = response.data;
      const nutritionLogs = Array.isArray(data.nutritionLogs) ? data.nutritionLogs : [];
      const score = typeof data.performanceScore === "number" ? data.performanceScore : 0;
      const readiness = typeof data.readinessScore === "number" ? data.readinessScore : 0;
      const dailyStats = data.dailyStats || {};
      const charts = data.charts || {};
      const proteinToday = dailyStats.protein?.today || 0;
      const proteinTarget = dailyStats.protein?.target || 170;
      const caloriesToday = dailyStats.calories?.today || 0;
      const carbsToday = dailyStats.carbs?.today || 0;
      const fatsToday = dailyStats.fats?.today || 0;
      const waterToday = dailyStats.water?.today || 0;
      const sleepToday = dailyStats.sleep?.today || 0;
      const sleepYesterday = dailyStats.sleep?.yesterday || 0;
      const sleepTarget = dailyStats.sleep?.target || 8;
      const caloriesTarget = dailyStats.calories?.target || 2500;
      const carbsTarget = dailyStats.carbs?.target || 250;
      const fatsTarget = dailyStats.fats?.target || 75;
      const waterTarget = dailyStats.water?.target || 3.5;
      const hasEnoughProfileData = Boolean(data.macroPlan?.hasEnoughProfileData);

      setPerformanceScore(score);
      setSleepDayInfo({ today: sleepToday, yesterday: sleepYesterday, target: sleepTarget });
      setNeedsOnboarding(!hasEnoughProfileData);
      setTodayPlan({
        caloriesLeft: getRemaining(caloriesTarget, caloriesToday),
        proteinLeft: getRemaining(proteinTarget, proteinToday),
        carbsLeft: getRemaining(carbsTarget, carbsToday),
        fatsLeft: getRemaining(fatsTarget, fatsToday),
        waterLeft: getRemaining(waterTarget, waterToday),
        caloriesTarget,
        proteinTarget,
        carbsTarget,
        fatsTarget,
        waterTarget,
      });
      setStats([
        {
          label: "Protein intake",
          value: `${proteinToday}g / ${proteinTarget}g`,
          delta: data.deltas?.protein || "No change vs yesterday",
          tone: proteinToday > 0 ? "positive" : "neutral",
        },
        {
          label: "Calories",
          value: `${caloriesToday} kcal`,
          delta: data.deltas?.calories || "No change vs yesterday",
          tone: caloriesToday > 0 ? "positive" : "neutral",
        },
        {
          label: "Sleep quality",
          value: `${sleepToday} hrs`,
          delta: data.deltas?.sleep || "No change vs yesterday",
          tone: sleepToday > 0 ? "positive" : "neutral",
        },
        {
          label: "Performance score",
          value: `${score} / 100`,
          delta: data.deltas?.performanceScore || "No change vs yesterday",
          tone: score > 0 ? "positive" : "neutral",
        },
        {
          label: "Readiness score",
          value: `${readiness} / 100`,
          delta: readiness > 0 ? (readiness >= 80 ? "Sufficiently recovered" : readiness < 70 ? "Consider resting" : "Tracking load") : "No data",
          tone: readiness > 0 ? (readiness >= 80 ? "positive" : "neutral") : "neutral",
        },
      ]);

      if (Array.isArray(data.aiInsights)) {
        setInsights(data.aiInsights);
      } else {
        setInsights([]);
      }

      if (Array.isArray(data.goals)) {
        setGoalItems(
          data.goals.map((goal: { id: string; title: string; currentValue: number; targetValue: number; unit: string }) => ({
            id: goal.id,
            title: goal.title,
            current: `${goal.currentValue}${goal.unit}`,
            target: `${goal.targetValue}${goal.unit}`,
            progress: Math.round((goal.currentValue / goal.targetValue) * 100),
          }))
        );
      } else {
        setGoalItems([]);
      }

      if (nutritionLogs.length > 0) {
        setNutritionItems(
          nutritionLogs.map(
            (entry: { mealName: string; calories: number; protein: number; carbs: number; fats: number }) => ({
              meal: entry.mealName,
              calories: entry.calories,
              macros: `${entry.protein}P / ${entry.carbs}C / ${entry.fats}F`,
            })
          )
        );
      } else {
        setNutritionItems([]);
      }

      setWorkoutChartData(charts.weeklyWorkoutProgress || { labels: [], datasets: [] });
      setNutritionChartData(charts.nutritionTrend || { labels: [], datasets: [] });
      setRunningChartData(charts.runningPerformance || { labels: [], datasets: [] });
      setStrengthChartData(charts.strengthImprovement || { labels: [], datasets: [] });
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      await Promise.all([loadDashboard(), loadSleepLogs()]);
    }

    void loadAll();
  }, [loadDashboard, loadSleepLogs]);

  async function handleSleepSave() {
    if (!isPositiveNumber(sleepHoursInput)) {
      pushToast("Enter valid sleep hours before saving.", "error");
      return;
    }

    const sleepHours = Number(sleepHoursInput);
    if (sleepHours > 24) {
      pushToast("Sleep hours cannot exceed 24 for a day.", "error");
      return;
    }

    setIsSavingSleep(true);
    try {
      if (editingSleepId) {
        await sleepApi.update(editingSleepId, {
          hours: sleepHours,
          note: sleepNoteInput.trim(),
        });
        pushToast("Sleep entry updated.", "success");
      } else {
        await sleepApi.create({
          hours: sleepHours,
          note: sleepNoteInput.trim(),
        });
        pushToast("Sleep entry saved for today.", "success");
      }

      setSleepHoursInput("");
      setSleepNoteInput("");
      setEditingSleepId(null);
      await Promise.all([loadDashboard(), loadSleepLogs()]);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not save sleep entry right now."), "error");
    } finally {
      setIsSavingSleep(false);
    }
  }

  function handleEditSleep(entry: SleepEntry) {
    setEditingSleepId(entry.id);
    setSleepHoursInput(String(entry.hours));
    setSleepNoteInput(entry.note || "");
  }

  function handleCancelSleepEdit() {
    setEditingSleepId(null);
    setSleepHoursInput("");
    setSleepNoteInput("");
  }

  async function handleDeleteSleep(entry: SleepEntry) {
    try {
      await sleepApi.remove(entry.id);
      setDeletedSleepEntry(entry);
      pushToast("Sleep entry deleted. You can undo this.", "info");
      if (editingSleepId === entry.id) {
        handleCancelSleepEdit();
      }
      await Promise.all([loadDashboard(), loadSleepLogs()]);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not delete sleep entry."), "error");
    }
  }

  async function handleUndoSleepDelete() {
    if (!deletedSleepEntry) return;

    setIsUndoingSleep(true);
    try {
      await sleepApi.create({
        hours: deletedSleepEntry.hours,
        note: deletedSleepEntry.note,
      });
      setDeletedSleepEntry(null);
      pushToast("Sleep entry restored.", "success");
      await Promise.all([loadDashboard(), loadSleepLogs()]);
    } catch (error) {
      pushToast(extractApiErrorMessage(error, "Could not restore sleep entry."), "error");
    } finally {
      setIsUndoingSleep(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Athlete dashboard"
        title="Everything that matters today, in one performance cockpit."
        description="Monitor calories, protein, workouts, sleep, hydration, running pace, and goal completion without losing context."
        badge={`Performance score ${performanceScore}`}
      />

      {needsOnboarding ? (
        <Card className="mb-6 border-app-accent/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-app-text-soft">Onboarding needed</p>
              <h3 className="mt-2 text-xl font-semibold text-app-text">
                Complete onboarding to unlock fully personalized daily targets.
              </h3>
              <p className="mt-2 text-sm text-app-text-soft">
                Add age, weight, height, activity level, and goal to power accurate macros and recovery planning.
              </p>
            </div>
            <Button type="button" onClick={() => navigate("/onboarding")}>
              Start onboarding
            </Button>
          </div>
        </Card>
      ) : null}

      {deletedSleepEntry ? (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-app-text-soft">
              Deleted sleep entry:{" "}
              <span className="font-semibold text-app-text">{deletedSleepEntry.hours}h</span>
            </p>
            <Button type="button" variant="secondary" disabled={isUndoingSleep} onClick={handleUndoSleepDelete}>
              {isUndoingSleep ? "Restoring..." : "Undo delete"}
            </Button>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <LineChartCard
            title="Weekly workout progress"
            subtitle="Training load across your current seven-day block."
            data={workoutChartData}
            emptyMessage="No workouts logged yet. Log sessions from the Workouts page to see your weekly progress."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <BarChartCard
              title="Nutrition trends"
              subtitle="Protein and carb intake through the week."
              data={nutritionChartData}
              emptyMessage="No nutrition data yet. Log meals to populate your macro trends."
            />
            <LineChartCard
              title="Running performance"
              subtitle="Steadier pace improvement over five weeks."
              data={runningChartData}
              emptyMessage="No runs logged yet. Add a running session to begin tracking performance."
            />
          </div>
          <BarChartCard
            title="Strength improvements"
            subtitle="Current top lifts and movement benchmarks."
            data={strengthChartData}
            emptyMessage="No strength entries yet. Log workouts with weight lifted to see improvement over time."
          />
        </div>

        <div className="grid gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-app-text">Today plan</h3>
            <p className="mt-2 text-sm text-app-text-soft">
              Live remaining targets for today based on your personalized macro profile.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-app-surface-strong p-4">
                <p className="text-sm text-app-text-soft">Calories left</p>
                <p className="mt-2 text-xl font-semibold text-app-text">
                  {todayPlan.caloriesLeft} kcal
                </p>
                <p className="text-xs text-app-text-soft">Target {todayPlan.caloriesTarget} kcal</p>
              </div>
              <div className="rounded-2xl bg-app-surface-strong p-4">
                <p className="text-sm text-app-text-soft">Protein left</p>
                <p className="mt-2 text-xl font-semibold text-app-text">
                  {todayPlan.proteinLeft} g
                </p>
                <p className="text-xs text-app-text-soft">Target {todayPlan.proteinTarget} g</p>
              </div>
              <div className="rounded-2xl bg-app-surface-strong p-4">
                <p className="text-sm text-app-text-soft">Carbs left</p>
                <p className="mt-2 text-xl font-semibold text-app-text">
                  {todayPlan.carbsLeft} g
                </p>
                <p className="text-xs text-app-text-soft">Target {todayPlan.carbsTarget} g</p>
              </div>
              <div className="rounded-2xl bg-app-surface-strong p-4">
                <p className="text-sm text-app-text-soft">Fats left</p>
                <p className="mt-2 text-xl font-semibold text-app-text">
                  {todayPlan.fatsLeft} g
                </p>
                <p className="text-xs text-app-text-soft">Target {todayPlan.fatsTarget} g</p>
              </div>
              <div className="rounded-2xl bg-app-surface-strong p-4 sm:col-span-2">
                <p className="text-sm text-app-text-soft">Water left</p>
                <p className="mt-2 text-xl font-semibold text-app-text">
                  {todayPlan.waterLeft} L
                </p>
                <p className="text-xs text-app-text-soft">Target {todayPlan.waterTarget} L</p>
              </div>
            </div>
          </Card>

          <Card>
            <ProgressRing value={goalItems.length === 0 ? 0 : Math.round(goalItems.reduce((sum, goal) => sum + goal.progress, 0) / goalItems.length)} label="Goal completion rings" />
            <div className="mt-6 grid gap-4">
              {goalItems.length === 0 ? (
                <p className="text-sm text-app-text-soft">
                  No goals set yet. Create one from the Goals page to start filling your progress rings.
                </p>
              ) : (
                goalItems.map((goal) => (
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

          <Card>
            <h3 className="text-lg font-semibold text-app-text">Sleep tracker</h3>
            <p className="mt-2 text-sm text-app-text-soft">
              Log sleep for today. Daily metrics reset every day and compare against yesterday.
            </p>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Optional note (sleep quality, wake-ups, recovery)"
                value={sleepNoteInput}
                onChange={(event) => setSleepNoteInput(event.target.value)}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                type="number"
                min="0"
                max="24"
                step="0.1"
                placeholder="Hours slept today"
                value={sleepHoursInput}
                onChange={(event) => setSleepHoursInput(event.target.value)}
              />
              <Button type="button" onClick={handleSleepSave} disabled={isSavingSleep}>
                {isSavingSleep ? "Saving..." : editingSleepId ? "Update sleep" : "Save sleep"}
              </Button>
            </div>
            {editingSleepId ? (
              <Button type="button" variant="ghost" className="mt-3 w-full" onClick={handleCancelSleepEdit}>
                Cancel sleep edit
              </Button>
            ) : null}
            <p className="mt-3 text-sm text-app-text-soft">
              Today: {sleepDayInfo.today}h / {sleepDayInfo.target}h target, Yesterday: {sleepDayInfo.yesterday}h
            </p>
            <div className="mt-4 grid gap-3">
              {sleepLogs.length === 0 ? (
                <div className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  No sleep logs yet. Add your first sleep entry above.
                </div>
              ) : (
                sleepLogs.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-app-surface-strong p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-app-text">{entry.hours} hrs</p>
                        <p className="text-xs text-app-text-soft">{entry.note || "No note"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => handleEditSleep(entry)}>
                          Edit
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => handleDeleteSleep(entry)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-app-text">Daily nutrition log</h3>
            <div className="mt-4 grid gap-3">
              {nutritionItems.length === 0 ? (
                <div className="rounded-2xl bg-app-surface-strong p-4 text-sm text-app-text-soft">
                  No meals logged yet. Add your first meal from Nutrition to populate today&apos;s intake.
                </div>
              ) : (
                nutritionItems.map((meal) => (
                  <div key={meal.meal} className="rounded-2xl bg-app-surface-strong p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-app-text">{meal.meal}</p>
                      <p className="text-sm text-app-text-soft">{meal.calories} kcal</p>
                    </div>
                    <p className="mt-2 text-sm text-app-text-soft">{meal.macros}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-app-text">AI performance assistant</h3>
            <div className="mt-4 grid gap-3">
              {insights.length === 0 ? (
                <div className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm leading-6 text-app-text-soft">
                  Insights will appear after you log workouts, meals, running sessions, and goals.
                </div>
              ) : (
                insights.map((insight) => (
                  <div key={insight} className="rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm leading-6 text-app-text">
                    {insight}
                  </div>
                ))
              )}
            </div>
            {isLoading ? <p className="mt-4 text-sm text-app-text-soft">Syncing live dashboard data...</p> : null}
          </Card>
        </div>
      </section>
    </div>
  );
}
