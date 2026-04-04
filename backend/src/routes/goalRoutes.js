const express = require("express");
const { goals, achievements } = require("../data/sampleData");
const Goal = require("../models/Goal");
const Achievement = require("../models/Achievement");
const { createRecord, listRecords } = require("../utils/persistence");

const router = express.Router();

router.get("/", async (_req, res) => {
  const goalRecords = await listRecords({ model: Goal, fallback: goals });
  const achievementRecords = await listRecords({ model: Achievement, fallback: achievements });
  res.json({ goals: goalRecords, achievements: achievementRecords });
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: Goal,
    fallback: goals,
    payload: req.body,
    transform: (payload, length) => ({
      id: `goal-${length + 1}`,
      ...payload,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
