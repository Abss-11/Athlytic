const express = require("express");
const { nutritionLogs } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const NutritionLog = require("../models/NutritionLog");
const { createRecord, listRecords } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const { filterRecordsForDay, sumNutrition, round } = require("../utils/dailyMetrics");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
}

router.get("/", async (req, res) => {
  const records = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.get("/summary", async (req, res) => {
  const records = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  const todayRecords = filterRecordsForDay(scopedRecords, 0);
  const yesterdayRecords = filterRecordsForDay(scopedRecords, -1);
  const todayTotals = sumNutrition(todayRecords);
  const yesterdayTotals = sumNutrition(yesterdayRecords);
  const currentUser = await getCurrentUser(req);
  const macroPlan = buildMacroPlan(currentUser?.profile || {});
  const targets = macroPlan.dailyTargets;

  res.json({
    today: {
      protein: round(todayTotals.protein),
      carbs: round(todayTotals.carbs),
      fats: round(todayTotals.fats),
      calories: round(todayTotals.calories),
      waterLiters: round(todayTotals.waterLiters),
    },
    yesterday: {
      protein: round(yesterdayTotals.protein),
      carbs: round(yesterdayTotals.carbs),
      fats: round(yesterdayTotals.fats),
      calories: round(yesterdayTotals.calories),
      waterLiters: round(yesterdayTotals.waterLiters),
    },
    targets: {
      protein: targets.protein,
      carbs: targets.carbs,
      fats: targets.fats,
      calories: targets.calories,
      waterLiters: targets.waterLiters,
    },
    recommendations: {
      aiAdvice: macroPlan.aiAdvice,
      dietSuggestions: macroPlan.dietSuggestions,
    },
  });
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: NutritionLog,
    fallback: nutritionLogs,
    payload: {
      ...req.body,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `nutrition-${length + 1}`,
      ...payload,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
