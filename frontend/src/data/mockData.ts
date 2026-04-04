import type { Achievement, CommunityPost, GoalData, RunningEntry, StatCardData, WorkoutEntry } from "../types";

export const dashboardStats: StatCardData[] = [
  { label: "Protein intake", value: "148g / 170g", delta: "+12g vs yesterday", tone: "positive" },
  { label: "Calories", value: "2,430 kcal", delta: "92% of target", tone: "neutral" },
  { label: "Sleep quality", value: "7.9 hrs", delta: "+34 min this week", tone: "positive" },
  { label: "Performance score", value: "86 / 100", delta: "+5 this week", tone: "positive" },
];

export const weeklyWorkoutProgress = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Training load",
      data: [58, 72, 49, 81, 76, 67, 42],
      borderColor: "#4c80ff",
      backgroundColor: "rgba(76, 128, 255, 0.18)",
      tension: 0.4,
      fill: true,
    },
  ],
};

export const nutritionTrend = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Protein",
      data: [145, 160, 152, 168, 158, 171, 148],
      backgroundColor: "#7dff52",
      borderRadius: 12,
    },
    {
      label: "Carbs",
      data: [220, 210, 238, 245, 231, 248, 219],
      backgroundColor: "#4c80ff",
      borderRadius: 12,
    },
  ],
};

export const runningPerformance = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
  datasets: [
    {
      label: "Pace (min/km)",
      data: [5.6, 5.4, 5.3, 5.15, 5.05],
      borderColor: "#7dff52",
      backgroundColor: "rgba(125, 255, 82, 0.16)",
      tension: 0.35,
      fill: true,
    },
  ],
};

export const strengthImprovement = {
  labels: ["Bench", "Squat", "Deadlift", "Pull-up", "Press"],
  datasets: [
    {
      label: "Current max",
      data: [98, 142, 176, 18, 64],
      backgroundColor: ["#4c80ff", "#7dff52", "#123d9a", "#9ad4ff", "#7bb6ff"],
      borderRadius: 10,
    },
  ],
};

export const dailyGoals: GoalData[] = [
  { id: "goal-protein", title: "Protein target", progress: 87, target: "170g", current: "148g" },
  { id: "goal-run", title: "Weekly running distance", progress: 72, target: "28 km", current: "20.2 km" },
  { id: "goal-strength", title: "Squat target", progress: 91, target: "155 kg", current: "141 kg" },
  { id: "goal-hydration", title: "Hydration consistency", progress: 94, target: "3.5 L", current: "3.3 L" },
];

export const workouts: WorkoutEntry[] = [
  { id: "w1", focus: "Lower body strength", volume: "28 sets", duration: "74 min", intensity: "High" },
  { id: "w2", focus: "Upper body hypertrophy", volume: "24 sets", duration: "68 min", intensity: "Medium" },
  { id: "w3", focus: "Sports performance", volume: "Plyometrics + sprint work", duration: "51 min", intensity: "High" },
];

export const runningSessions: RunningEntry[] = [
  { id: "r1", label: "Tempo interval", distance: 8.6, pace: "5:02 /km", vo2Max: 51 },
  { id: "r2", label: "Recovery run", distance: 5.1, pace: "5:38 /km", vo2Max: 49 },
  { id: "r3", label: "Long endurance", distance: 12.3, pace: "5:22 /km", vo2Max: 52 },
];

export const nutritionSummary = [
  { label: "Protein", consumed: 148, target: 170, unit: "g" },
  { label: "Carbs", consumed: 232, target: 250, unit: "g" },
  { label: "Fats", consumed: 67, target: 75, unit: "g" },
  { label: "Water", consumed: 3.3, target: 3.5, unit: "L" },
];

export const coachAthletes = [
  { name: "Maya Singh", sport: "Middle distance", score: 90, goalStatus: "Ahead of plan" },
  { name: "Ethan Brooks", sport: "Strength & conditioning", score: 84, goalStatus: "On track" },
  { name: "Ariana Cole", sport: "Cross training", score: 78, goalStatus: "Needs recovery focus" },
];

export const aiInsights = [
  "Your protein intake is 22g below target today. Add a post-workout meal to recover stronger.",
  "You improved your running pace by 5.2% over the last four weeks while keeping VO2 Max trending up.",
  "Sleep consistency has been your strongest lever this week. Keep the same bedtime window for race prep.",
];

export const achievements: Achievement[] = [
  { id: "a1", label: "7-Day Streak", description: "Closed all daily activity rings for a full week." },
  { id: "a2", label: "PR Crusher", description: "Set new personal records in squat and 5K pace." },
  { id: "a3", label: "Coach Favorite", description: "Completed every assigned training block this month." },
];

export const communityPosts: CommunityPost[] = [
  {
    id: "c1",
    athlete: "Naomi Reid",
    role: "Sprinter",
    content: "Closed out a speed block with my fastest 400m split this season. Recovery and macros finally feel dialed in.",
    metric: "400m pace down 3.8%",
    likes: 128,
  },
  {
    id: "c2",
    athlete: "Leo Martinez",
    role: "Hybrid athlete",
    content: "First week balancing heavy squats with tempo runs and the dashboard kept me honest on sleep and hydration.",
    metric: "4 workouts logged",
    likes: 94,
  },
];

export const mealFeed = [
  { meal: "Breakfast bowl", calories: 620, macros: "42P / 68C / 19F" },
  { meal: "Chicken rice lunch", calories: 710, macros: "54P / 76C / 18F" },
  { meal: "Recovery smoothie", calories: 320, macros: "29P / 36C / 7F" },
];

export const dashboardHighlights = [
  "Training streak: 13 days",
  "Water intake: 3.3L",
  "Sleep debt: 0.4 hrs",
  "Weekly challenge: 84% complete",
];
