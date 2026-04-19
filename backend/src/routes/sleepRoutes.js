const express = require("express");
const { sleepLogs } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const SleepLog = require("../models/SleepLog");
const { createRecord, deleteRecord, listRecords, updateRecord } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const { validateSleepInput } = require("../utils/requestValidation");
const { filterRecordsForDay, round, sumSleepHours } = require("../utils/dailyMetrics");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
}

async function findOwnedSleepEntry({ id, athleteId }) {
  const records = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const scopedRecords = filterByAthlete(records, athleteId);
  return scopedRecords.find((record) => String(record.id) === String(id)) || null;
}

router.get("/", async (req, res) => {
  const records = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.get("/summary", async (req, res) => {
  const records = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  const todayRecords = filterRecordsForDay(scopedRecords, 0);
  const yesterdayRecords = filterRecordsForDay(scopedRecords, -1);
  const currentUser = await getCurrentUser(req);
  const macroPlan = buildMacroPlan(currentUser?.profile || {});

  res.json({
    today: {
      hours: round(sumSleepHours(todayRecords)),
    },
    yesterday: {
      hours: round(sumSleepHours(yesterdayRecords)),
    },
    targets: {
      hours: macroPlan.dailyTargets.sleepHours,
    },
  });
});

router.post("/", async (req, res) => {
  const validation = validateSleepInput(req.body, { partial: false });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Sleep input validation failed.",
      errors: validation.errors,
    });
  }

  const entry = await createRecord({
    model: SleepLog,
    fallback: sleepLogs,
    payload: {
      ...validation.data,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `sleep-${length + 1}`,
      ...payload,
    }),
  });

  return res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedSleepEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Sleep entry not found." });
  }

  const validation = validateSleepInput(req.body, { partial: true });
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Sleep input validation failed.",
      errors: validation.errors,
    });
  }

  if (Object.keys(validation.data).length === 0) {
    return res.status(400).json({ message: "No valid sleep fields were provided for update." });
  }

  const updated = await updateRecord({
    model: SleepLog,
    fallback: sleepLogs,
    id: entry.id,
    payload: validation.data,
  });

  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const athleteId = req.user?.sub;
  const entry = await findOwnedSleepEntry({ id: req.params.id, athleteId });
  if (!entry) {
    return res.status(404).json({ message: "Sleep entry not found." });
  }

  const deleted = await deleteRecord({
    model: SleepLog,
    fallback: sleepLogs,
    id: entry.id,
  });

  return res.json({
    id: deleted?.id || entry.id,
    message: "Sleep entry deleted.",
  });
});

module.exports = router;
