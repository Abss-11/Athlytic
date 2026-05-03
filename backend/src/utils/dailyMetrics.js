function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getStartOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getEndOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getDayWindow(offset = 0, baseDate = new Date()) {
  const start = getStartOfDay(baseDate);
  start.setDate(start.getDate() + offset);
  const end = getEndOfDay(start);
  return { start, end };
}

function getWeekWindow(weekOffset = 0, baseDate = new Date()) {
  const start = getStartOfDay(baseDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day + weekOffset * 7);
  
  const end = getEndOfDay(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function pickRecordDate(record) {
  return toDate(record.loggedAt || record.createdAt || record.updatedAt);
}

function filterRecordsForWindow(records, window) {
  return records.filter((record) => {
    const recordDate = pickRecordDate(record);
    return recordDate && recordDate >= window.start && recordDate <= window.end;
  });
}

function filterRecordsForDay(records, offset = 0, baseDate = new Date()) {
  return filterRecordsForWindow(records, getDayWindow(offset, baseDate));
}

function filterRecordsForWeek(records, weekOffset = 0, baseDate = new Date()) {
  return filterRecordsForWindow(records, getWeekWindow(weekOffset, baseDate));
}

function sumNutrition(records) {
  return records.reduce(
    (accumulator, record) => ({
      protein: accumulator.protein + (record.protein || 0),
      carbs: accumulator.carbs + (record.carbs || 0),
      fats: accumulator.fats + (record.fats || 0),
      calories: accumulator.calories + (record.calories || 0),
      waterLiters: accumulator.waterLiters + (record.waterLiters || 0),
    }),
    { protein: 0, carbs: 0, fats: 0, calories: 0, waterLiters: 0 }
  );
}

function sumRunningDistance(records) {
  return records.reduce((distance, record) => distance + (record.distanceKm || 0), 0);
}

function sumWorkoutDuration(records) {
  return records.reduce((duration, record) => duration + (record.durationMinutes || 0), 0);
}

function getWorkoutVolume(record) {
  if (!record || typeof record !== "object") {
    return 0;
  }

  if (typeof record.totalLoadKg === "number" && Number.isFinite(record.totalLoadKg) && record.totalLoadKg >= 0) {
    return record.totalLoadKg;
  }

  if (Array.isArray(record.exercises) && record.exercises.length > 0) {
    return record.exercises.reduce((accumulator, exercise) => {
      const sets = Number(exercise?.sets) || 0;
      const reps = Number(exercise?.reps) || 0;
      const weight = Number(exercise?.weightLifted) || 0;
      return accumulator + sets * reps * weight;
    }, 0);
  }

  const sets = Number(record.sets) || 0;
  const reps = Number(record.reps) || 0;
  const weight = Number(record.weightLifted) || 0;

  if (sets > 0 && reps > 0 && weight > 0) {
    return sets * reps * weight;
  }

  return weight;
}

function sumWorkoutVolume(records) {
  return records.reduce((volume, record) => volume + getWorkoutVolume(record), 0);
}

function sumWeightLifted(records) {
  return sumWorkoutVolume(records);
}

function sumSleepHours(records) {
  return records.reduce((hours, record) => hours + (record.hours || 0), 0);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculatePerformanceScore({ protein, calories, workoutCount, runningDistanceKm, sleepHours, targets = {} }) {
  const proteinTarget = targets.protein || 170;
  const calorieTarget = targets.calories || 2500;
  const runningTarget = targets.runningDistanceKm || 5;
  const sleepTarget = targets.sleepHours || 8;

  const proteinScore = Math.min((protein / proteinTarget) * 100, 100);
  const calorieScore = Math.min((calories / calorieTarget) * 100, 100);
  const workoutScore = Math.min(workoutCount * 40, 100);
  const runningScore = Math.min((runningDistanceKm / runningTarget) * 100, 100);
  const sleepScore = Math.min((sleepHours / sleepTarget) * 100, 100);

  return clampScore((proteinScore + calorieScore + workoutScore + runningScore + sleepScore) / 5);
}

function calculateReadinessScore({ recentSleepLogs = [], recentWorkouts = [], sleepTarget = 8, windowDays = 3 }) {
  const totalSleep = sumSleepHours(recentSleepLogs);
  const avgSleep = totalSleep / windowDays;

  const intensityMap = { low: 0.5, moderate: 1, high: 1.5 };

  const workoutLoad = recentWorkouts.reduce((acc, w) => {
    const factor = intensityMap[w.intensity?.toLowerCase()] || 1;
    const duration = w.durationMinutes || 45;
    return acc + (duration * factor);
  }, 0);

  const sleepScore = Math.min((avgSleep / sleepTarget) * 100, 100);

  const rawLoadPenalty = Math.max(0, (workoutLoad - 150) * 0.1);
  const loadPenalty = rawLoadPenalty * (1 - (sleepScore / 200));

  return clampScore(sleepScore - loadPenalty);
}

function buildLastNDaySeries(records, numberOfDays, getValue, baseDate = new Date()) {
  const labels = [];
  const values = [];

  for (let offset = -(numberOfDays - 1); offset <= 0; offset += 1) {
    const window = getDayWindow(offset, baseDate);
    const dayRecords = filterRecordsForWindow(records, window);
    labels.push(window.start.toLocaleDateString("en-US", { weekday: "short" }));
    values.push(round(getValue(dayRecords)));
  }

  return { labels, values };
}

function buildYesterdayDeltaText(todayValue, yesterdayValue, unit = "") {
  const difference = round(todayValue - yesterdayValue);
  if (difference > 0) {
    return `+${difference}${unit} vs yesterday`;
  }
  if (difference < 0) {
    return `${difference}${unit} vs yesterday`;
  }
  return `No change vs yesterday`;
}

module.exports = {
  getWeekWindow,
  filterRecordsForDay,
  filterRecordsForWeek,
  sumNutrition,
  sumRunningDistance,
  sumWorkoutDuration,
  sumWorkoutVolume,
  sumWeightLifted,
  sumSleepHours,
  calculatePerformanceScore,
  calculateReadinessScore,
  buildLastNDaySeries,
  buildYesterdayDeltaText,
  round,
};
