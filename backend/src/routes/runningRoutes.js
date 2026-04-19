const express = require("express");
const { runningSessions } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const RunningData = require("../models/RunningData");
const { createRecord, deleteRecord, listRecords, updateRecord } = require("../utils/persistence");
const { validateRunningInput } = require("../utils/requestValidation");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
}

async function findOwnedRunningEntry({ id, athleteId }) {
  const records = await listRecords({ model: RunningData, fallback: runningSessions });
  const scopedRecords = filterByAthlete(records, athleteId);
  return scopedRecords.find((record) => String(record.id) === String(id)) || null;
}

router.get("/", async (req, res) => {
  const records = await listRecords({ model: RunningData, fallback: runningSessions });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.post("/", async (req, res) => {
  const validation = validateRunningInput(req.body, { partial: false });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Running input validation failed.",
      errors: validation.errors,
    });
  }

  const entry = await createRecord({
    model: RunningData,
    fallback: runningSessions,
    payload: {
      ...validation.data,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `running-${length + 1}`,
      ...payload,
    }),
  });

  return res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedRunningEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Running entry not found." });
  }

  const validation = validateRunningInput(req.body, { partial: true });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Running input validation failed.",
      errors: validation.errors,
    });
  }

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({ message: "No valid running fields were provided for update." });
  }

  const updated = await updateRecord({
    model: RunningData,
    fallback: runningSessions,
    id: entry.id,
    payload: validation.data,
  });

  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedRunningEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Running entry not found." });
  }

  const deleted = await deleteRecord({
    model: RunningData,
    fallback: runningSessions,
    id: entry.id,
  });

  return res.json({
    id: deleted?.id || entry.id,
    message: "Running entry deleted.",
  });
});

module.exports = router;
