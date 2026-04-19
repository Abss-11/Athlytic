const express = require("express");
const { protect } = require("../middleware/auth");
const { createRecord } = require("../utils/persistence");
const RunningData = require("../models/RunningData");
const SleepLog = require("../models/SleepLog");
const Workout = require("../models/Workout");
const { runningSessions, sleepLogs, workouts } = require("../data/sampleData");

const router = express.Router();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.post("/sync/:provider", protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const athleteId = req.user?.sub;

    // Simulate network delay communicating with the wearable provider's API
    await delay(1500 + Math.random() * 1000);

    const now = new Date();
    const syncedRecords = [];

    // Garmin and Apple Health specialize in tracking workouts and running
    if (provider === "apple_health" || provider === "garmin") {
      const distance = 5 + Math.round(Math.random() * 7 * 10) / 10;
      const duration = 25 + Math.round(Math.random() * 35);
      
      const run = await createRecord({
        model: RunningData,
        fallback: runningSessions,
        payload: {
          athleteId,
          distanceKm: distance,
          durationMinutes: duration,
          pace: `5:${15 + Math.round(Math.random() * 30)}`,
          vo2Max: 45 + Math.round(Math.random() * 10),
          personalRecord: Math.random() > 0.8,
          loggedAt: now,
        },
        transform: (p, len) => ({ id: `run-sync-${len + 1}`, ...p }),
      });
      syncedRecords.push({ type: "RunningData", id: run.id });
    }

    // Whoop, Oura, and Apple Health are heavy on recovery and sleep
    if (provider === "whoop" || provider === "oura" || provider === "apple_health") {
      const sleep = await createRecord({
        model: SleepLog,
        fallback: sleepLogs,
        payload: {
          athleteId,
          hours: 5.5 + Math.round(Math.random() * 3.5 * 10) / 10,
          quality: ["poor", "fair", "good", "excellent"][Math.floor(Math.random() * 4)],
          loggedAt: now,
        },
        transform: (p, len) => ({ id: `sleep-sync-${len + 1}`, ...p }),
      });
      syncedRecords.push({ type: "SleepLog", id: sleep.id });
      
      // Sometimes sync a low-intensity active recovery workout
      if (Math.random() > 0.5) {
        const workout = await createRecord({
            model: Workout,
            fallback: workouts,
            payload: {
                athleteId,
                focus: "Active Recovery",
                bodyRegion: "Full Body Mobility",
                sets: 3,
                reps: 10,
                weightLifted: 0,
                durationMinutes: 15,
                intensity: "low",
                loggedAt: now,
            },
            transform: (p, len) => ({ id: `workout-sync-${len + 1}`, ...p })
        });
        syncedRecords.push({ type: "Workout", id: workout.id });
      }
    }

    res.json({
      message: `Successfully synchronized data from ${provider}`,
      syncedRecords,
    });
  } catch (error) {
    console.error("Integration Sync Error:", error);
    res.status(500).json({ message: "Failed to sync wearable data" });
  }
});

module.exports = router;
