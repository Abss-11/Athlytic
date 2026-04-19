const express = require("express");
const { protect } = require("../middleware/auth");
const NutritionLog = require("../models/NutritionLog");
const RunningData = require("../models/RunningData");
const SleepLog = require("../models/SleepLog");
const Workout = require("../models/Workout");
const { nutritionLogs, runningSessions, sleepLogs, workouts } = require("../data/sampleData");
const { listRecords } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const {
  getWeekWindow,
  filterRecordsForWeek,
  sumNutrition,
  sumRunningDistance,
  sumWorkoutDuration,
  sumSleepHours,
  calculatePerformanceScore,
  round,
} = require("../utils/dailyMetrics");

const router = express.Router();

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }
  return records.filter((record) => record.athleteId === athleteId);
}

function formatDateRange(start, end) {
  const formatOpts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", formatOpts)} - ${end.toLocaleDateString("en-US", formatOpts)}`;
}

router.get("/weekly", protect, async (req, res) => {
  try {
    const athleteId = req.user?.sub;
    const currentUser = await getCurrentUser(req);
  const macroPlan = buildMacroPlan(currentUser?.profile || {});
  const targets = macroPlan.dailyTargets;

  const liveNutritionLogs = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const liveRunningSessions = await listRecords({ model: RunningData, fallback: runningSessions });
  const liveSleepLogs = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const liveWorkouts = await listRecords({ model: Workout, fallback: workouts });

  const scopedNutritionLogs = filterByAthlete(liveNutritionLogs, athleteId);
  const scopedRunningSessions = filterByAthlete(liveRunningSessions, athleteId);
  const scopedSleepLogs = filterByAthlete(liveSleepLogs, athleteId);
  const scopedWorkouts = filterByAthlete(liveWorkouts, athleteId);

  const numberOfWeeks = 4;
  const weeklyReports = [];

  for (let offset = 0; offset > -numberOfWeeks; offset--) {
    const window = getWeekWindow(offset);
    const weekTitle = formatDateRange(window.start, window.end);
    let label = weekTitle;
    if (offset === 0) label = "This Week";
    else if (offset === -1) label = "Last Week";
    
    // Using string representation to distinguish labels easily
    // "This Week (Apr 6 - Apr 12)"
    const displayLabel = offset > -2 ? `${label} (${weekTitle})` : weekTitle;

    const navData = filterRecordsForWeek(scopedNutritionLogs, offset);
    const runData = filterRecordsForWeek(scopedRunningSessions, offset);
    const sleepData = filterRecordsForWeek(scopedSleepLogs, offset);
    const workoutData = filterRecordsForWeek(scopedWorkouts, offset);

    const weekNutrition = sumNutrition(navData);
    const totalDistanceKm = round(sumRunningDistance(runData));
    const totalWorkoutDuration = sumWorkoutDuration(workoutData);
    const totalSleep = sumSleepHours(sleepData);

    const daysInWeek = 7;
    const avgProtein = round(weekNutrition.protein / daysInWeek);
    const avgCalories = round(weekNutrition.calories / daysInWeek);
    const avgSleep = round(totalSleep / daysInWeek);

    // To estimate score, we pass weekly averages/totals scaled down
    const score = calculatePerformanceScore({
      protein: avgProtein,
      calories: avgCalories,
      workoutCount: workoutData.length / daysInWeek,
      runningDistanceKm: totalDistanceKm / daysInWeek,
      sleepHours: avgSleep,
      targets: {
        protein: targets.protein,
        calories: targets.calories,
        runningDistanceKm: targets.runningDistanceKm,
        sleepHours: targets.sleepHours,
      },
    });

    weeklyReports.push({
      id: `week-${offset}`,
      title: displayLabel,
      totalWorkouts: workoutData.length,
      totalWorkoutDuration,
      totalRunningDistance: totalDistanceKm,
      avgProtein,
      avgCalories,
      avgSleep,
      performanceScore: score,
    });
  }

    res.json({
      reports: weeklyReports,
    });
  } catch (error) {
    console.error("Weekly Reports Error:", error);
    res.status(500).json({ message: `Backend Error: ${error.message}` });
  }
});

module.exports = router;
