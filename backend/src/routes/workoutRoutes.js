const express = require("express");
const { workouts } = require("../data/sampleData");
const { protect } = require("../middleware/auth");
const Workout = require("../models/Workout");
const { createRecord, deleteRecord, listRecords, updateRecord } = require("../utils/persistence");
const { validateWorkoutInput } = require("../utils/requestValidation");
const {
  filterRecordsForDay,
  filterRecordsForWeek,
  sumWorkoutDuration,
  sumWorkoutVolume,
  buildYesterdayDeltaText,
  round,
} = require("../utils/dailyMetrics");

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

function getWorkoutExercises(record) {
  if (Array.isArray(record.exercises) && record.exercises.length > 0) {
    return record.exercises;
  }

  return [
    {
      name: record.focus || "Workout",
      bodyRegion: record.bodyRegion || "Other",
      sets: Number(record.sets) || 0,
      reps: Number(record.reps) || 0,
      weightLifted: Number(record.weightLifted) || 0,
    },
  ];
}

function buildWorkoutSnapshot(records) {
  const sessions = records.length;
  const exercises = records.reduce((sum, workout) => sum + getWorkoutExercises(workout).length, 0);
  const sets = records.reduce((sum, workout) => sum + (Number(workout.sets) || 0), 0);
  const durationMinutes = round(sumWorkoutDuration(records));
  const volumeKg = round(sumWorkoutVolume(records));

  return {
    sessions,
    exercises,
    sets,
    durationMinutes,
    volumeKg,
  };
}

function buildMuscleGroupStats(records) {
  const regionMap = new Map();

  records.forEach((record) => {
    const seenRegionsForSession = new Set();
    getWorkoutExercises(record).forEach((exercise) => {
      const region = exercise.bodyRegion || "Other";
      const sets = Number(exercise.sets) || 0;
      const reps = Number(exercise.reps) || 0;
      const weightLifted = Number(exercise.weightLifted) || 0;
      const volumeKg = sets * reps * weightLifted;
      const existing = regionMap.get(region) || { region, sessions: 0, sets: 0, volumeKg: 0 };

      existing.sets += sets;
      existing.volumeKg += volumeKg;
      if (!seenRegionsForSession.has(region)) {
        existing.sessions += 1;
        seenRegionsForSession.add(region);
      }

      regionMap.set(region, existing);
    });
  });

  return Array.from(regionMap.values())
    .map((entry) => ({
      ...entry,
      volumeKg: round(entry.volumeKg),
    }))
    .sort((left, right) => right.volumeKg - left.volumeKg);
}

router.get("/", async (req, res) => {
  const records = await listRecords({ model: Workout, fallback: workouts });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  res.json(scopedRecords);
});

router.get("/summary", async (req, res) => {
  const records = await listRecords({ model: Workout, fallback: workouts });
  const scopedRecords = filterByAthlete(records, req.user?.sub);
  const todayRecords = filterRecordsForDay(scopedRecords, 0);
  const yesterdayRecords = filterRecordsForDay(scopedRecords, -1);
  const thisWeekRecords = filterRecordsForWeek(scopedRecords, 0);
  const lastWeekRecords = filterRecordsForWeek(scopedRecords, -1);
  const thisWeekMuscleGroups = buildMuscleGroupStats(thisWeekRecords);
  const lastWeekMuscleGroups = buildMuscleGroupStats(lastWeekRecords);
  const lastWeekMap = new Map(lastWeekMuscleGroups.map((entry) => [entry.region, entry]));
  const thisWeekVolumeTotal = round(thisWeekMuscleGroups.reduce((sum, item) => sum + item.volumeKg, 0));
  const thisWeekSetsTotal = thisWeekMuscleGroups.reduce((sum, item) => sum + item.sets, 0);

  res.json({
    today: buildWorkoutSnapshot(todayRecords),
    yesterday: buildWorkoutSnapshot(yesterdayRecords),
    thisWeek: buildWorkoutSnapshot(thisWeekRecords),
    lastWeek: buildWorkoutSnapshot(lastWeekRecords),
    deltas: {
      sessions: buildYesterdayDeltaText(todayRecords.length, yesterdayRecords.length),
      duration: buildYesterdayDeltaText(sumWorkoutDuration(todayRecords), sumWorkoutDuration(yesterdayRecords), " min"),
      volumeKg: buildYesterdayDeltaText(sumWorkoutVolume(todayRecords), sumWorkoutVolume(yesterdayRecords), " kg"),
    },
    muscleGroups: {
      thisWeek: thisWeekMuscleGroups.map((entry) => {
        const previous = lastWeekMap.get(entry.region);
        const deltaVolumeKg = round(entry.volumeKg - (previous?.volumeKg || 0));
        const deltaPercent =
          previous && previous.volumeKg > 0 ? round((deltaVolumeKg / previous.volumeKg) * 100) : null;

        return {
          ...entry,
          deltaVolumeKg,
          deltaPercent,
        };
      }),
      totalVolumeKg: thisWeekVolumeTotal,
      totalSets: thisWeekSetsTotal,
    },
  });
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
