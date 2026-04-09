const express = require("express");
const { runningSessions } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const RunningData = require("../models/RunningData");
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
  const records = await listRecords({ model: RunningData, fallback: runningSessions });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: RunningData,
    fallback: runningSessions,
    payload: {
      ...req.body,
      athleteId: req.user?.sub,
      loggedAt: new Date(),
    },
    transform: (payload, length) => ({
      id: `running-${length + 1}`,
      ...payload,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
