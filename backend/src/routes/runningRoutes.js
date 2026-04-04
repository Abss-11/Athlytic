const express = require("express");
const { runningSessions } = require("../data/sampleData");
const RunningData = require("../models/RunningData");
const { createRecord, listRecords } = require("../utils/persistence");

const router = express.Router();

router.get("/", async (_req, res) => {
  const records = await listRecords({ model: RunningData, fallback: runningSessions });
  res.json(records);
});

router.post("/", async (req, res) => {
  const entry = await createRecord({
    model: RunningData,
    fallback: runningSessions,
    payload: {
      ...req.body,
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
