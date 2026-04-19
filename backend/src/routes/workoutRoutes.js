const express = require("express");
const { workouts } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const Workout = require("../models/Workout");
const { createRecord, deleteRecord, listRecords, updateRecord } = require("../utils/persistence");
const { validateWorkoutInput } = require("../utils/requestValidation");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) return records;
  return records.filter((record) => record.athleteId === athleteId);
}

async function findOwnedWorkoutEntry({ id, athleteId }) {
  const records = await listRecords({ model: Workout, fallback: workouts });
  const scopedRecords = filterByAthlete(records, athleteId);
  return scopedRecords.find((record) => String(record.id) === String(id)) || null;
}

router.get("/", async (req, res) => {
  const records = await listRecords({ model: Workout, fallback: workouts });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.post("/", async (req, res) => {
  const validation = validateWorkoutInput(req.body, { partial: false });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Workout input validation failed.",
      errors: validation.errors,
    });
  }

  const entry = await createRecord({
    model: Workout,
    fallback: workouts,
    payload: {
      ...validation.data,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `workout-${length + 1}`,
      ...payload,
    }),
  });

  return res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedWorkoutEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Workout entry not found." });
  }

  const validation = validateWorkoutInput(req.body, { partial: true });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Workout input validation failed.",
      errors: validation.errors,
    });
  }

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({ message: "No valid workout fields were provided for update." });
  }

  const updated = await updateRecord({
    model: Workout,
    fallback: workouts,
    id: entry.id,
    payload: validation.data,
  });

  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedWorkoutEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Workout entry not found." });
  }

  const deleted = await deleteRecord({
    model: Workout,
    fallback: workouts,
    id: entry.id,
  });

  return res.json({
    id: deleted?.id || entry.id,
    message: "Workout entry deleted.",
  });
});

module.exports = router;
