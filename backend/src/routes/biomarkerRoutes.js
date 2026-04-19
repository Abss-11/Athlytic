const express = require("express");
const { protect } = require("../middleware/auth");
const BiomarkerLog = require("../models/BiomarkerLog");
const { listRecords, createRecord, deleteRecord } = require("../utils/persistence");

const router = express.Router();

// Fallback data if MongoDB is disconnected
const fallbackBiomarkers = [];

router.get("/", protect, async (req, res) => {
  const athleteId = req.user?.sub;
  const records = await listRecords({ model: BiomarkerLog, fallback: fallbackBiomarkers });
  const athleteRecords = athleteId ? records.filter((r) => r.athleteId === athleteId) : records;
  // Sort descending by date
  athleteRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(athleteRecords);
});

router.post("/", protect, async (req, res) => {
  const athleteId = req.user?.sub;
  const newLog = await createRecord({
    model: BiomarkerLog,
    fallback: fallbackBiomarkers,
    payload: { ...req.body, athleteId },
    transform: (payload, count) => ({ id: `bio-${count}`, ...payload, date: new Date().toISOString() }),
  });
  res.status(201).json(newLog);
});

router.delete("/:id", protect, async (req, res) => {
  await deleteRecord({
    model: BiomarkerLog,
    fallback: fallbackBiomarkers,
    id: req.params.id,
  });
  res.status(204).send();
});

module.exports = router;
