const express = require("express");
const { workouts } = require("../data/sampleData");
const Workout = require("../models/Workout");
const { createRecord, listRecords } = require("../utils/persistence");

const router = express.Router();

router.get("/", async (_req, res) => {
  const records = await listRecords({ model: Workout, fallback: workouts });
  res.json(records);
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: Workout,
    fallback: workouts,
    payload: {
      ...req.body,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `workout-${length + 1}`,
      ...payload,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
