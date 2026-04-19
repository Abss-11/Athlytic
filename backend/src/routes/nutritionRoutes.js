const express = require("express");
const { nutritionLogs } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const NutritionLog = require("../models/NutritionLog");
const { createRecord, deleteRecord, listRecords, updateRecord } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const { validateNutritionInput } = require("../utils/requestValidation");
const { filterRecordsForDay, sumNutrition, round } = require("../utils/dailyMetrics");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
}

async function findOwnedNutritionEntry({ id, athleteId }) {
  const records = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  const scopedRecords = filterByAthlete(records, athleteId);
  return scopedRecords.find((record) => String(record.id) === String(id)) || null;
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
  const validation = validateNutritionInput(req.body, { partial: false });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Nutrition input validation failed.",
      errors: validation.errors,
    });
  }

  const entry = await createRecord({
    model: NutritionLog,
    fallback: nutritionLogs,
    payload: {
      ...validation.data,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `nutrition-${length + 1}`,
      ...payload,
    }),
  });

  return res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedNutritionEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Nutrition entry not found." });
  }

  const validation = validateNutritionInput(req.body, { partial: true });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Nutrition input validation failed.",
      errors: validation.errors,
    });
  }

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({ message: "No valid nutrition fields were provided for update." });
  }

  const updated = await updateRecord({
    model: NutritionLog,
    fallback: nutritionLogs,
    id: entry.id,
    payload: validation.data,
  });

  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedNutritionEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Nutrition entry not found." });
  }

  const deleted = await deleteRecord({
    model: NutritionLog,
    fallback: nutritionLogs,
    id: entry.id,
  });

  return res.json({
    id: deleted?.id || entry.id,
    message: "Nutrition entry deleted.",
  });
});

module.exports = router;
