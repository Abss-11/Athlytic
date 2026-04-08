const express = require("express");
const { nutritionLogs } = require("../data/sampleData");
const NutritionLog = require("../models/NutritionLog");
const { createRecord, listRecords } = require("../utils/persistence");
const { filterRecordsForDay, sumNutrition, round } = require("../utils/dailyMetrics");

const router = express.Router();

router.get("/", async (_req, res) => {
  const records = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  res.json(records);
});

router.get("/summary", async (_req, res) => {
  const records = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const todayRecords = filterRecordsForDay(records, 0);
  const yesterdayRecords = filterRecordsForDay(records, -1);
  const todayTotals = sumNutrition(todayRecords);
  const yesterdayTotals = sumNutrition(yesterdayRecords);

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
      protein: 170,
      carbs: 250,
      fats: 75,
      waterLiters: 3.5,
    },
  });
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: NutritionLog,
    fallback: nutritionLogs,
    payload: {
      ...req.body,
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
