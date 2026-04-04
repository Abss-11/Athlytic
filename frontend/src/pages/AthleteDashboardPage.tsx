import { useEffect, useState } from "react";
import axios from "axios";
import { dashboardApi } from "../api/api";
import BarChartCard from "../components/charts/BarChartCard";
import LineChartCard from "../components/charts/LineChartCard";
import StatCard from "../components/dashboard/StatCard";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import ProgressRing from "../components/ui/ProgressRing";
import type { StatCardData } from "../types";

type ChartState = {
  labels: string[];
  datasets: any[];
};

export default function AthleteDashboardPage() {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await dashboardApi.getAthleteDashboard();
        const data = response.data;
        const nutritionLogs = Array.isArray(data.nutritionLogs) ? data.nutritionLogs : [];
        const workouts = Array.isArray(data.workouts) ? data.workouts : [];
        const runningSessions = Array.isArray(data.runningSessions) ? data.runningSessions : [];
        const score = typeof data.performanceScore === "number" ? data.performanceScore : 0;
        const proteinTotal = nutritionLogs.reduce((sum: number, item: { protein?: number }) => sum + (item.protein || 0), 0);
        const calorieTotal = nutritionLogs.reduce((sum: number, item: { calories?: number }) => sum + (item.calories || 0), 0);

        setPerformanceScore(score);
        setStats([
          {
            label: "Protein intake",
            value: `${proteinTotal}g / 170g`,
            delta: nutritionLogs.length === 0 ? "No meals logged yet" : `${Math.round((proteinTotal / 170) * 100)}% of target`,
            tone: proteinTotal > 0 ? "positive" : "neutral",
          },
          {
            label: "Calories",
            value: `${calorieTotal} kcal`,
            delta: nutritionLogs.length === 0 ? "0% of target" : `${Math.round((calorieTotal / 2500) * 100)}% of target`,
            tone: calorieTotal > 0 ? "positive" : "neutral",
          },
          {
            label: "Sleep quality",
            value: `${data.sleepHours ?? 0} hrs`,
            delta: data.sleepHours ? "Live recovery data loaded" : "No sleep data yet",
            tone: data.sleepHours ? "positive" : "neutral",
          },
          {
            label: "Performance score",
            value: `${score} / 100`,
            delta: score > 0 ? "Built from your current data" : "Start tracking to build your score",
            tone: score > 0 ? "positive" : "neutral",
          },
        ]);

        if (Array.isArray(data.aiInsights)) {
          setInsights(data.aiInsights);
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
        }

        setWorkoutChartData({
          labels: workouts.map((workout: { focus: string }) => workout.focus),
          datasets: workouts.length
            ? [
                {
                  label: "Duration (min)",
                  data: workouts.map((workout: { durationMinutes?: number }) => workout.durationMinutes ?? 0),
                  borderColor: "#4c80ff",
                  backgroundColor: "rgba(76, 128, 255, 0.18)",
                  tension: 0.4,
                  fill: true,
                },
              ]
            : [],
        });

        setNutritionChartData({
          labels: nutritionLogs.map((entry: { mealName: string }) => entry.mealName),
          datasets: nutritionLogs.length
            ? [
                {
                  label: "Protein",
                  data: nutritionLogs.map((entry: { protein?: number }) => entry.protein ?? 0),
                  backgroundColor: "#7dff52",
                  borderRadius: 12,
                },
                {
                  label: "Carbs",
                  data: nutritionLogs.map((entry: { carbs?: number }) => entry.carbs ?? 0),
                  backgroundColor: "#4c80ff",
                  borderRadius: 12,
                },
              ]
            : [],
        });

        setRunningChartData({
          labels: runningSessions.map((_session: { pace: string }, index: number) => `Run ${index + 1}`),
          datasets: runningSessions.length
            ? [
                {
                  label: "Distance (km)",
                  data: runningSessions.map((session: { distanceKm?: number }) => session.distanceKm ?? 0),
                  borderColor: "#7dff52",
                  backgroundColor: "rgba(125, 255, 82, 0.16)",
                  tension: 0.35,
                  fill: true,
                },
              ]
            : [],
        });

        setStrengthChartData({
          labels: workouts.map((workout: { focus: string }) => workout.focus),
          datasets: workouts.length
            ? [
                {
                  label: "Weight lifted",
                  data: workouts.map((workout: { weightLifted?: number }) => workout.weightLifted ?? 0),
                  backgroundColor: ["#4c80ff", "#7dff52", "#123d9a", "#9ad4ff", "#7bb6ff"],
                  borderRadius: 10,
                },
              ]
            : [],
        });
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

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
