const express = require("express");
const { workouts } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const Workout = require("../models/Workout");
const { createRecord, listRecords } = require("../utils/persistence");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
}

router.get("/", async (req, res) => {
  const records = await listRecords({ model: Workout, fallback: workouts });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: Workout,
    fallback: workouts,
    payload: {
      ...req.body,
      athleteId: req.user?.sub,
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
