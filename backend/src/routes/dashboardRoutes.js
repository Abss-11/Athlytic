const express = require("express");
const { dashboardSummary, goals, nutritionLogs, runningSessions, sleepLogs, workouts } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const Goal = require("../models/Goal");
const NutritionLog = require("../models/NutritionLog");
const RunningData = require("../models/RunningData");
const SleepLog = require("../models/SleepLog");
const Workout = require("../models/Workout");
const { listRecords } = require("../utils/persistence");
const {
  filterRecordsForDay,
  sumNutrition,
  sumRunningDistance,
  sumSleepHours,
  sumWorkoutDuration,
  sumWeightLifted,
  calculatePerformanceScore,
  buildLastNDaySeries,
  buildYesterdayDeltaText,
  round,
} = require("../utils/dailyMetrics");

const router = express.Router();

router.get("/athlete", protect, async (_req, res) => {
  const liveGoals = await listRecords({ model: Goal, fallback: goals });
  const liveNutritionLogs = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const liveRunningSessions = await listRecords({ model: RunningData, fallback: runningSessions });
  const liveSleepLogs = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const liveWorkouts = await listRecords({ model: Workout, fallback: workouts });
  const todayNutritionLogs = filterRecordsForDay(liveNutritionLogs, 0);
  const yesterdayNutritionLogs = filterRecordsForDay(liveNutritionLogs, -1);
  const todayWorkouts = filterRecordsForDay(liveWorkouts, 0);
  const yesterdayWorkouts = filterRecordsForDay(liveWorkouts, -1);
  const todayRunningSessions = filterRecordsForDay(liveRunningSessions, 0);
  const yesterdayRunningSessions = filterRecordsForDay(liveRunningSessions, -1);
  const todaySleepLogs = filterRecordsForDay(liveSleepLogs, 0);
  const yesterdaySleepLogs = filterRecordsForDay(liveSleepLogs, -1);
  const todayNutrition = sumNutrition(todayNutritionLogs);
  const yesterdayNutrition = sumNutrition(yesterdayNutritionLogs);
  const todayDistanceKm = round(sumRunningDistance(todayRunningSessions));
  const yesterdayDistanceKm = round(sumRunningDistance(yesterdayRunningSessions));
  const todaySleepHours = round(sumSleepHours(todaySleepLogs));
  const yesterdaySleepHours = round(sumSleepHours(yesterdaySleepLogs));
  const todayScore = calculatePerformanceScore({
    protein: todayNutrition.protein,
    calories: todayNutrition.calories,
    workoutCount: todayWorkouts.length,
    runningDistanceKm: todayDistanceKm,
    sleepHours: todaySleepHours,
  });
  const yesterdayScore = calculatePerformanceScore({
    protein: yesterdayNutrition.protein,
    calories: yesterdayNutrition.calories,
    workoutCount: yesterdayWorkouts.length,
    runningDistanceKm: yesterdayDistanceKm,
    sleepHours: yesterdaySleepHours,
  });
  const workoutSeries = buildLastNDaySeries(liveWorkouts, 7, sumWorkoutDuration);
  const proteinSeries = buildLastNDaySeries(liveNutritionLogs, 7, (records) => sumNutrition(records).protein);
  const carbsSeries = buildLastNDaySeries(liveNutritionLogs, 7, (records) => sumNutrition(records).carbs);
  const runningSeries = buildLastNDaySeries(liveRunningSessions, 7, sumRunningDistance);
  const strengthSeries = buildLastNDaySeries(liveWorkouts, 7, sumWeightLifted);

  const aiInsights = [];
  if (todayNutrition.calories === 0 && todayWorkouts.length === 0 && todayDistanceKm === 0) {
    aiInsights.push("No activity logged for today yet. Start with one meal, workout, or run to begin tracking.");
  }
  if (todayNutrition.protein < 170) {
    aiInsights.push(`Protein is ${Math.max(0, 170 - todayNutrition.protein)}g below today's target.`);
  }
  if (todayDistanceKm > yesterdayDistanceKm) {
    aiInsights.push(`Running distance improved by ${round(todayDistanceKm - yesterdayDistanceKm)} km vs yesterday.`);
  }
  if (todayWorkouts.length > yesterdayWorkouts.length) {
    aiInsights.push("Workout consistency is up compared with yesterday.");
  }
  if (todaySleepHours > 0 && todaySleepHours < 7) {
    aiInsights.push("Sleep is below 7 hours today. Recovery may be impacted.");
  }

  res.json({
    performanceScore: todayScore,
    performanceDelta: todayScore - yesterdayScore,
    sleepHours: dashboardSummary.athlete.sleepHours || 0,
    dailyStats: {
      protein: {
        today: round(todayNutrition.protein),
        yesterday: round(yesterdayNutrition.protein),
        target: 170,
      },
      calories: {
        today: round(todayNutrition.calories),
        yesterday: round(yesterdayNutrition.calories),
        target: 2500,
      },
      sleep: {
        today: todaySleepHours,
        yesterday: yesterdaySleepHours,
        target: 8,
      },
      workouts: {
        today: todayWorkouts.length,
        yesterday: yesterdayWorkouts.length,
        target: 1,
      },
      runningDistance: {
        today: todayDistanceKm,
        yesterday: yesterdayDistanceKm,
        target: 5,
      },
    },
    aiInsights,
    deltas: {
      protein: buildYesterdayDeltaText(todayNutrition.protein, yesterdayNutrition.protein, "g"),
      calories: buildYesterdayDeltaText(todayNutrition.calories, yesterdayNutrition.calories, " kcal"),
      sleep: buildYesterdayDeltaText(todaySleepHours, yesterdaySleepHours, "h"),
      performanceScore: buildYesterdayDeltaText(todayScore, yesterdayScore),
    },
    charts: {
      weeklyWorkoutProgress: {
        labels: workoutSeries.labels,
        datasets: [
          {
            label: "Duration (min)",
            data: workoutSeries.values,
            borderColor: "#4c80ff",
            backgroundColor: "rgba(76, 128, 255, 0.18)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      nutritionTrend: {
        labels: proteinSeries.labels,
        datasets: [
          {
            label: "Protein",
            data: proteinSeries.values,
            backgroundColor: "#7dff52",
            borderRadius: 12,
          },
          {
            label: "Carbs",
            data: carbsSeries.values,
            backgroundColor: "#4c80ff",
            borderRadius: 12,
          },
        ],
      },
      runningPerformance: {
        labels: runningSeries.labels,
        datasets: [
          {
            label: "Distance (km)",
            data: runningSeries.values,
            borderColor: "#7dff52",
            backgroundColor: "rgba(125, 255, 82, 0.16)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      strengthImprovement: {
        labels: strengthSeries.labels,
        datasets: [
          {
            label: "Weight lifted",
            data: strengthSeries.values,
            backgroundColor: "#4c80ff",
            borderRadius: 10,
          },
        ],
      },
    },
    goals: liveGoals,
    workouts: todayWorkouts,
    nutritionLogs: todayNutritionLogs,
    runningSessions: todayRunningSessions,
    sleepLogs: todaySleepLogs,
  });
});

router.get("/coach", protect, (_req, res) => {
  res.json(dashboardSummary.coach);
});

module.exports = router;
