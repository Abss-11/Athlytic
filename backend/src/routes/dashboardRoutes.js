const express = require("express");
const { dashboardSummary, goals, nutritionLogs, runningSessions, sleepLogs, workouts } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const Goal = require("../models/Goal");
const NutritionLog = require("../models/NutritionLog");
const RunningData = require("../models/RunningData");
const SleepLog = require("../models/SleepLog");
const Workout = require("../models/Workout");
const BiomarkerLog = require("../models/BiomarkerLog");
const { listRecords } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const {
  filterRecordsForDay,
  sumNutrition,
  sumRunningDistance,
  sumSleepHours,
  sumWorkoutDuration,
  sumWeightLifted,
  calculatePerformanceScore,
  calculateReadinessScore,
  buildLastNDaySeries,
  buildYesterdayDeltaText,
  round,
} = require("../utils/dailyMetrics");

const router = express.Router();

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
}

router.get("/athlete", protect, async (req, res) => {
  const athleteId = req.user?.sub;
  const currentUser = await getCurrentUser(req);
  const macroPlan = buildMacroPlan(currentUser?.profile || {});
  const targets = macroPlan.dailyTargets;
  const liveGoals = await listRecords({ model: Goal, fallback: goals });
  const liveNutritionLogs = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const liveRunningSessions = await listRecords({ model: RunningData, fallback: runningSessions });
  const liveSleepLogs = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const liveWorkouts = await listRecords({ model: Workout, fallback: workouts });
  const liveBiomarkers = await listRecords({ model: BiomarkerLog, fallback: [] });
  const scopedGoals = athleteId ? liveGoals.filter((goal) => goal.athleteId === athleteId) : liveGoals;
  const scopedNutritionLogs = filterByAthlete(liveNutritionLogs, athleteId);
  const scopedRunningSessions = filterByAthlete(liveRunningSessions, athleteId);
  const scopedSleepLogs = filterByAthlete(liveSleepLogs, athleteId);
  const scopedWorkouts = filterByAthlete(liveWorkouts, athleteId);
  const scopedBiomarkers = filterByAthlete(liveBiomarkers, athleteId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const todayNutritionLogs = filterRecordsForDay(scopedNutritionLogs, 0);
  const yesterdayNutritionLogs = filterRecordsForDay(scopedNutritionLogs, -1);
  const todayWorkouts = filterRecordsForDay(scopedWorkouts, 0);
  const yesterdayWorkouts = filterRecordsForDay(scopedWorkouts, -1);
  const todayRunningSessions = filterRecordsForDay(scopedRunningSessions, 0);
  const yesterdayRunningSessions = filterRecordsForDay(scopedRunningSessions, -1);
  const todaySleepLogs = filterRecordsForDay(scopedSleepLogs, 0);
  const yesterdaySleepLogs = filterRecordsForDay(scopedSleepLogs, -1);
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
    targets: {
      protein: targets.protein,
      calories: targets.calories,
      runningDistanceKm: targets.runningDistanceKm,
      sleepHours: targets.sleepHours,
    },
  });
  const yesterdayScore = calculatePerformanceScore({
    protein: yesterdayNutrition.protein,
    calories: yesterdayNutrition.calories,
    workoutCount: yesterdayWorkouts.length,
    runningDistanceKm: yesterdayDistanceKm,
    sleepHours: yesterdaySleepHours,
    targets: {
      protein: targets.protein,
      calories: targets.calories,
      runningDistanceKm: targets.runningDistanceKm,
      sleepHours: targets.sleepHours,
    },
  });
  const workoutSeries = buildLastNDaySeries(scopedWorkouts, 7, sumWorkoutDuration);
  const proteinSeries = buildLastNDaySeries(scopedNutritionLogs, 7, (records) => sumNutrition(records).protein);
  const carbsSeries = buildLastNDaySeries(scopedNutritionLogs, 7, (records) => sumNutrition(records).carbs);
  const runningSeries = buildLastNDaySeries(scopedRunningSessions, 7, sumRunningDistance);
  const strengthSeries = buildLastNDaySeries(scopedWorkouts, 7, sumWeightLifted);

  const aiInsights = [];
  if (todayNutrition.calories === 0 && todayWorkouts.length === 0 && todayDistanceKm === 0) {
    aiInsights.push("No activity logged for today yet. Start with one meal, workout, or run to begin tracking.");
  }
  if (todayNutrition.protein < targets.protein) {
    aiInsights.push(
      `Protein is ${Math.max(0, round(targets.protein - todayNutrition.protein))}g below today's target.`
    );
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
  for (const recommendation of macroPlan.aiAdvice.slice(0, 2)) {
    aiInsights.push(recommendation);
  }
  const recentWorkouts = [];
  const recentSleepLogs = [];
  for (let offset = -2; offset <= 0; offset++) {
    recentWorkouts.push(...filterRecordsForDay(scopedWorkouts, offset));
    recentSleepLogs.push(...filterRecordsForDay(scopedSleepLogs, offset));
  }

  const readinessScore = calculateReadinessScore({
    recentSleepLogs,
    recentWorkouts,
    sleepTarget: targets.sleepHours,
    windowDays: 3,
  });

  if (readinessScore < 70) {
    let biomarkerInsightAdded = false;
    if (scopedBiomarkers.length > 0) {
      const latestBiomarker = scopedBiomarkers[0];
      if (latestBiomarker.ferritin && latestBiomarker.ferritin < 30) {
        aiInsights.push(`Your ferritin levels were low (${latestBiomarker.ferritin} ng/mL) in your last lab test. This recent drop in performance and readiness might be linked to iron deficiency. Consider consulting your doctor about an iron supplement.`);
        biomarkerInsightAdded = true;
      }
    }
    
    if (!biomarkerInsightAdded) {
      aiInsights.push(`Readiness is low (${Math.round(readinessScore)}/100). You're trending toward overtraining based on recent intense workouts and sleep history. Consider a rest day.`);
    }
  }

  res.json({
    readinessScore: Math.round(readinessScore),
    performanceScore: todayScore,
    performanceDelta: todayScore - yesterdayScore,
    sleepHours: todaySleepHours,
    dailyStats: {
      protein: {
        today: round(todayNutrition.protein),
        yesterday: round(yesterdayNutrition.protein),
        target: targets.protein,
      },
      carbs: {
        today: round(todayNutrition.carbs),
        yesterday: round(yesterdayNutrition.carbs),
        target: targets.carbs,
      },
      fats: {
        today: round(todayNutrition.fats),
        yesterday: round(yesterdayNutrition.fats),
        target: targets.fats,
      },
      water: {
        today: round(todayNutrition.waterLiters),
        yesterday: round(yesterdayNutrition.waterLiters),
        target: targets.waterLiters,
      },
      calories: {
        today: round(todayNutrition.calories),
        yesterday: round(yesterdayNutrition.calories),
        target: targets.calories,
      },
      sleep: {
        today: todaySleepHours,
        yesterday: yesterdaySleepHours,
        target: targets.sleepHours,
      },
      workouts: {
        today: todayWorkouts.length,
        yesterday: yesterdayWorkouts.length,
        target: 1,
      },
      runningDistance: {
        today: todayDistanceKm,
        yesterday: yesterdayDistanceKm,
        target: targets.runningDistanceKm,
      },
    },
    aiInsights,
    macroPlan,
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
    goals: scopedGoals,
    workouts: todayWorkouts,
    nutritionLogs: todayNutritionLogs,
    runningSessions: todayRunningSessions,
    sleepLogs: todaySleepLogs,
  });
});

router.get("/notifications", protect, async (req, res) => {
  const athleteId = req.user?.sub;
  const liveSleepLogs = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const liveWorkouts = await listRecords({ model: Workout, fallback: workouts });
  const liveRunningSessions = await listRecords({ model: RunningData, fallback: runningSessions });
  
  const scopedSleepLogs = filterByAthlete(liveSleepLogs, athleteId);
  const scopedWorkouts = filterByAthlete(liveWorkouts, athleteId);
  const scopedRunningSessions = filterByAthlete(liveRunningSessions, athleteId);
  
  const todaySleepLogs = filterRecordsForDay(scopedSleepLogs, 0);
  const yesterdaySleepLogs = filterRecordsForDay(scopedSleepLogs, -1);
  const todayWorkouts = filterRecordsForDay(scopedWorkouts, 0);
  const yesterdayWorkouts = filterRecordsForDay(scopedWorkouts, -1);
  const todayRunningSessions = filterRecordsForDay(scopedRunningSessions, 0);
  const yesterdayRunningSessions = filterRecordsForDay(scopedRunningSessions, -1);
  
  const todaySleepHours = round(sumSleepHours(todaySleepLogs));
  const yesterdaySleepHours = round(sumSleepHours(yesterdaySleepLogs));
  const todayDistanceKm = round(sumRunningDistance(todayRunningSessions));
  const yesterdayDistanceKm = round(sumRunningDistance(yesterdayRunningSessions));

  const notifications = [];

  if (todaySleepHours < yesterdaySleepHours) {
    notifications.push({
      id: "sleep_drop",
      title: "Sleep Alert",
      message: `You slept ${round(yesterdaySleepHours - todaySleepHours)} hours less than yesterday. Recovery may be impacted.`,
      type: "warning"
    });
  }

  if (todayWorkouts.length < yesterdayWorkouts.length) {
    notifications.push({
      id: "workout_drop",
      title: "Workout Consistency",
      message: "You logged fewer workouts today compared to yesterday.",
      type: "info"
    });
  }

  if (yesterdayDistanceKm > 0 && todayDistanceKm < yesterdayDistanceKm) {
    notifications.push({
      id: "running_drop",
      title: "Running Volume Down",
      message: `Running distance dropped by ${round(yesterdayDistanceKm - todayDistanceKm)} km vs yesterday.`,
      type: "warning"
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      id: "all_good",
      title: "All Good",
      message: "Your performance metrics are stable or improving!",
      type: "success"
    });
  }

  res.json(notifications);
});

router.get("/coach", protect, (_req, res) => {
  res.json(dashboardSummary.coach);
});

module.exports = router;
