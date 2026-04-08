import { useCallback, useEffect, useState } from "react";
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
import { isPositiveNumber } from "../lib/validation";
import type { StatCardData } from "../types";

type ChartState = {
  labels: string[];
  datasets: any[];
};

export default function AthleteDashboardPage() {
  const { pushToast } = useToast();
  const [stats, setStats] = useState<StatCardData[]>([
    { label: "Protein intake", value: "0g / 170g", delta: "No meals logged yet", tone: "neutral" },
    { label: "Calories", value: "0 kcal", delta: "0% of target", tone: "neutral" },
    { label: "Sleep quality", value: "0 hrs", delta: "No sleep data yet", tone: "neutral" },
    { label: "Performance score", value: "0 / 100", delta: "Start tracking to build your score", tone: "neutral" },
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
  const [sleepDayInfo, setSleepDayInfo] = useState({ today: 0, yesterday: 0, target: 8 });
  const [isSavingSleep, setIsSavingSleep] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await dashboardApi.getAthleteDashboard();
      const data = response.data;
      const nutritionLogs = Array.isArray(data.nutritionLogs) ? data.nutritionLogs : [];
      const score = typeof data.performanceScore === "number" ? data.performanceScore : 0;
      const dailyStats = data.dailyStats || {};
      const charts = data.charts || {};
      const proteinToday = dailyStats.protein?.today || 0;
      const proteinTarget = dailyStats.protein?.target || 170;
      const caloriesToday = dailyStats.calories?.today || 0;
      const sleepToday = dailyStats.sleep?.today || 0;
      const sleepYesterday = dailyStats.sleep?.yesterday || 0;
      const sleepTarget = dailyStats.sleep?.target || 8;

      setPerformanceScore(score);
      setSleepDayInfo({ today: sleepToday, yesterday: sleepYesterday, target: sleepTarget });
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
    void loadDashboard();
  }, [loadDashboard]);

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
      await sleepApi.create({
        athleteId: "ath-1",
        hours: sleepHours,
      });
      pushToast("Sleep entry saved for today.", "success");
      setSleepHoursInput("");
      await loadDashboard();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        pushToast(error.response?.data?.message || "Could not save sleep entry right now.", "error");
      } else {
        pushToast("Could not save sleep entry right now.", "error");
      }
    } finally {
      setIsSavingSleep(false);
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
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
                {isSavingSleep ? "Saving..." : "Save sleep"}
              </Button>
            </div>
            <p className="mt-3 text-sm text-app-text-soft">
              Today: {sleepDayInfo.today}h / {sleepDayInfo.target}h target, Yesterday: {sleepDayInfo.yesterday}h
            </p>
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
