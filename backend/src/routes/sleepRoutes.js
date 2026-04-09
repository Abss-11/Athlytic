const express = require("express");
const { sleepLogs } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const SleepLog = require("../models/SleepLog");
const { createRecord, listRecords } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const { filterRecordsForDay, round, sumSleepHours } = require("../utils/dailyMetrics");

const router = express.Router();

router.use(protect);

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }

  return records.filter((record) => record.athleteId === athleteId);
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
  const entry = await createRecord({
    model: SleepLog,
    fallback: sleepLogs,
    payload: {
      ...req.body,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `sleep-${length + 1}`,
      ...payload,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
