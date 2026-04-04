const express = require("express");
const { dashboardSummary, goals, nutritionLogs, runningSessions, workouts } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const Goal = require("../models/Goal");
const NutritionLog = require("../models/NutritionLog");
const RunningData = require("../models/RunningData");
const Workout = require("../models/Workout");
const { listRecords } = require("../utils/persistence");

const router = express.Router();

router.get("/athlete", protect, async (_req, res) => {
  const liveGoals = await listRecords({ model: Goal, fallback: goals });
  const liveNutritionLogs = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const liveRunningSessions = await listRecords({ model: RunningData, fallback: runningSessions });
  const liveWorkouts = await listRecords({ model: Workout, fallback: workouts });

  res.json({
    ...dashboardSummary.athlete,
    goals: liveGoals,
    workouts: liveWorkouts,
    nutritionLogs: liveNutritionLogs,
    runningSessions: liveRunningSessions,
  });
});

router.get("/coach", protect, (_req, res) => {
  res.json(dashboardSummary.coach);
});

module.exports = router;
