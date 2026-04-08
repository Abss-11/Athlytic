const express = require("express");
const { sleepLogs } = require("../data/sampleData");
const SleepLog = require("../models/SleepLog");
const { createRecord, listRecords } = require("../utils/persistence");
const { filterRecordsForDay, round, sumSleepHours } = require("../utils/dailyMetrics");

const router = express.Router();

router.get("/", async (_req, res) => {
  const records = await listRecords({ model: SleepLog, fallback: sleepLogs });
  res.json(records);
});

router.get("/summary", async (_req, res) => {
  const records = await listRecords({ model: SleepLog, fallback: sleepLogs });
  const todayRecords = filterRecordsForDay(records, 0);
  const yesterdayRecords = filterRecordsForDay(records, -1);

  res.json({
    today: {
      hours: round(sumSleepHours(todayRecords)),
    },
    yesterday: {
      hours: round(sumSleepHours(yesterdayRecords)),
    },
    targets: {
      hours: 8,
    },
  });
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: SleepLog,
    fallback: sleepLogs,
    payload: {
      ...req.body,
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
