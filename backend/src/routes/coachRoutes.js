const express = require("express");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const Workout = require("../models/Workout");
const RunningData = require("../models/RunningData");
const SleepLog = require("../models/SleepLog");
const NutritionLog = require("../models/NutritionLog");
const Goal = require("../models/Goal");
const BiomarkerLog = require("../models/BiomarkerLog");

const { sampleUsers, workouts, runningSessions, sleepLogs, nutritionLogs, goals } = require("../data/sampleData");
const { isDatabaseConnected } = require("../config/db");
const { normalizeDocument, createRecord } = require("../utils/persistence");

const router = express.Router();

router.use(protect);

function toPublicUser(user) {
  return {
    id: user._id ? String(user._id) : user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile || {},
  };
}

// 1. Get all athletes
router.get("/athletes", async (req, res) => {
  let athletes = [];

  if (isDatabaseConnected()) {
    const dbAthletes = await User.find({ role: "athlete" });
    athletes = dbAthletes.map(normalizeDocument);
  } else {
    athletes = sampleUsers.filter((u) => u.role === "athlete");
  }

  res.json({
    athletes: athletes.map(toPublicUser),
  });
});

// 2. Update athlete notes (medical notes)
router.put("/athletes/:id/notes", async (req, res) => {
  const { notes } = req.body;
  const { id } = req.params;

  let targetUser = null;

  if (isDatabaseConnected()) {
    targetUser = await User.findById(id);
    if (targetUser && targetUser.role === "athlete") {
      const currentProfile = targetUser.profile && typeof targetUser.profile.toObject === 'function' 
        ? targetUser.profile.toObject() 
        : (targetUser.profile || {});
      targetUser.profile = { ...currentProfile, medicalNotes: notes };
      await targetUser.save();
      targetUser = normalizeDocument(targetUser);
    } else {
      targetUser = null;
    }
  } else {
    targetUser = sampleUsers.find((u) => u.id === id && u.role === "athlete");
    if (targetUser) {
      targetUser.profile = { ...(targetUser.profile || {}), medicalNotes: notes };
    }
  }

  if (!targetUser) {
    return res.status(404).json({ message: "Athlete not found." });
  }

  res.json({
    message: "Notes updated successfully",
    athlete: toPublicUser(targetUser),
  });
});

// 3. Update athlete coach feedback
router.put("/athletes/:id/feedback", async (req, res) => {
  const { feedback } = req.body;
  const { id } = req.params;

  let targetUser = null;

  if (isDatabaseConnected()) {
    targetUser = await User.findById(id);
    if (targetUser && targetUser.role === "athlete") {
      const currentProfile = targetUser.profile && typeof targetUser.profile.toObject === 'function' 
        ? targetUser.profile.toObject() 
        : (targetUser.profile || {});
      targetUser.profile = { ...currentProfile, coachFeedback: feedback };
      await targetUser.save();
      targetUser = normalizeDocument(targetUser);
    } else {
      targetUser = null;
    }
  } else {
    targetUser = sampleUsers.find((u) => u.id === id && u.role === "athlete");
    if (targetUser) {
      targetUser.profile = { ...(targetUser.profile || {}), coachFeedback: feedback };
    }
  }

  if (!targetUser) {
    return res.status(404).json({ message: "Athlete not found." });
  }

  res.json({
    message: "Feedback updated successfully",
    athlete: toPublicUser(targetUser),
  });
});

// 4. Get athlete performance deep dive logs
router.get("/athletes/:id/performance", async (req, res) => {
  const { id } = req.params;

  let targetUser = null;
  let workoutsList = [];
  let runningList = [];
  let sleepList = [];
  let nutritionList = [];
  let goalsList = [];
  let biomarkersList = [];

  if (isDatabaseConnected()) {
    targetUser = await User.findById(id);
    if (targetUser && targetUser.role === "athlete") {
      workoutsList = await Workout.find({ athleteId: id });
      runningList = await RunningData.find({ athleteId: id });
      sleepList = await SleepLog.find({ athleteId: id });
      nutritionList = await NutritionLog.find({ athleteId: id });
      goalsList = await Goal.find({ athleteId: id });
      biomarkersList = await BiomarkerLog.find({ athleteId: id });
    }
  } else {
    targetUser = sampleUsers.find((u) => u.id === id && u.role === "athlete");
    if (targetUser) {
      workoutsList = workouts.filter((w) => w.athleteId === id);
      runningList = runningSessions.filter((r) => r.athleteId === id);
      sleepList = sleepLogs.filter((s) => s.athleteId === id);
      nutritionList = nutritionLogs.filter((n) => n.athleteId === id);
      goalsList = goals.filter((g) => g.athleteId === id);
      biomarkersList = [];
    }
  }

  if (!targetUser) {
    return res.status(404).json({ message: "Athlete not found." });
  }

  res.json({
    athlete: toPublicUser(targetUser),
    workouts: workoutsList.map(normalizeDocument),
    running: runningList.map(normalizeDocument),
    sleep: sleepList.map(normalizeDocument),
    nutrition: nutritionList.map(normalizeDocument),
    goals: goalsList.map(normalizeDocument),
    biomarkers: biomarkersList.map(normalizeDocument),
  });
});

// 5. Assign goal directly to athlete
router.post("/athletes/:id/goals", async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body, athleteId: id };

  const entry = await createRecord({
    model: Goal,
    fallback: goals,
    payload,
    transform: (p, length) => ({
      id: `goal-${length + 1}`,
      ...p,
    }),
  });

  res.status(201).json(entry);
});

module.exports = router;
