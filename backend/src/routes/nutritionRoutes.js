const express = require("express");
const { nutritionLogs } = require("../data/sampleData");
const NutritionLog = require("../models/NutritionLog");
const { createRecord, listRecords } = require("../utils/persistence");

const router = express.Router();

router.get("/", async (_req, res) => {
  const records = await listRecords({ model: NutritionLog, fallback: nutritionLogs });
  res.json(records);
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
