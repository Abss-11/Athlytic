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

function sumWeightLifted(records) {
  return records.reduce((weight, record) => weight + (record.weightLifted || 0), 0);
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

function calculatePerformanceScore({ protein, calories, workoutCount, runningDistanceKm, sleepHours }) {
  const proteinScore = Math.min((protein / 170) * 100, 100);
  const calorieScore = Math.min((calories / 2500) * 100, 100);
  const workoutScore = Math.min(workoutCount * 40, 100);
  const runningScore = Math.min((runningDistanceKm / 5) * 100, 100);
  const sleepScore = Math.min((sleepHours / 8) * 100, 100);

  return clampScore((proteinScore + calorieScore + workoutScore + runningScore + sleepScore) / 5);
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
  filterRecordsForDay,
  sumNutrition,
  sumRunningDistance,
  sumWorkoutDuration,
  sumWeightLifted,
  sumSleepHours,
  calculatePerformanceScore,
  buildLastNDaySeries,
  buildYesterdayDeltaText,
  round,
};
