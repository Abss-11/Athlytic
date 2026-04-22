const express = require("express");
const PDFDocument = require("pdfkit");
const { protect } = require("../middleware/auth");
const NutritionLog = require("../models/NutritionLog");
const RunningData = require("../models/RunningData");
const SleepLog = require("../models/SleepLog");
const Workout = require("../models/Workout");
const { nutritionLogs, runningSessions, sleepLogs, workouts } = require("../data/sampleData");
const { listRecords } = require("../utils/persistence");
const { getCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan } = require("../utils/macroPlanner");
const {
  getWeekWindow,
  filterRecordsForDay,
  filterRecordsForWeek,
  sumNutrition,
  sumRunningDistance,
  sumWorkoutDuration,
  sumSleepHours,
  calculatePerformanceScore,
  round,
} = require("../utils/dailyMetrics");

const router = express.Router();
const scoreLabelMap = {
  protein: "Protein adherence",
  calories: "Calorie adherence",
  workouts: "Workout consistency",
  running: "Running volume",
  sleep: "Sleep consistency",
};

function filterByAthlete(records, athleteId) {
  if (!athleteId) {
    return records;
  }
  return records.filter((record) => record.athleteId === athleteId);
}

function formatDateRange(start, end) {
  const formatOpts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", formatOpts)} - ${end.toLocaleDateString("en-US", formatOpts)}`;
}

function componentScore(value, target) {
  if (!target) {
    return 0;
  }
  return Math.min(round((value / target) * 100), 100);
}

function calculateScoreBreakdown({ protein, calories, workoutCount, runningDistanceKm, sleepHours, targets }) {
  const proteinTarget = targets.protein || 170;
  const calorieTarget = targets.calories || 2500;
  const runningTarget = targets.runningDistanceKm || 5;
  const sleepTarget = targets.sleepHours || 8;

  return {
    protein: componentScore(protein, proteinTarget),
    calories: componentScore(calories, calorieTarget),
    workouts: Math.min(round(workoutCount * 40), 100),
    running: componentScore(runningDistanceKm, runningTarget),
    sleep: componentScore(sleepHours, sleepTarget),
  };
}

function buildPerformanceExplanation({ protein, calories, workoutCount, runningDistanceKm, sleepHours, targets }) {
  const breakdown = calculateScoreBreakdown({
    protein,
    calories,
    workoutCount,
    runningDistanceKm,
    sleepHours,
    targets,
  });

  const score = calculatePerformanceScore({
    protein,
    calories,
    workoutCount,
    runningDistanceKm,
    sleepHours,
    targets,
  });

  const ordered = Object.entries(breakdown)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);

  const strongest = ordered[0];
  const limiting = ordered[ordered.length - 1];

  let summary = "Building momentum this week.";
  if (score >= 85) {
    summary = "Excellent consistency across training, recovery, and nutrition.";
  } else if (score >= 70) {
    summary = "Strong week overall with one or two optimization opportunities.";
  } else if (score >= 50) {
    summary = "Moderate adherence. Tightening execution will lift score quickly.";
  } else {
    summary = "Early-stage consistency. Focus on daily habits to establish rhythm.";
  }

  const strongestLabel = scoreLabelMap[strongest.key] || strongest.key;
  const limitingLabel = scoreLabelMap[limiting.key] || limiting.key;

  return {
    score,
    summary: `${summary} Strongest: ${strongestLabel} (${strongest.value}/100). Limiter: ${limitingLabel} (${limiting.value}/100).`,
    strongestArea: { key: strongest.key, label: strongestLabel, score: strongest.value },
    limitingArea: { key: limiting.key, label: limitingLabel, score: limiting.value },
    breakdown: Object.entries(breakdown).map(([key, value]) => ({
      key,
      label: scoreLabelMap[key] || key,
      score: value,
    })),
  };
}

function buildTrendMetric(label, currentValue, previousValue, unit = "") {
  const current = round(currentValue || 0);
  const previous = round(previousValue || 0);
  const delta = round(current - previous);
  const percentChange = previous === 0 ? null : round((delta / previous) * 100);

  return {
    label,
    unit,
    current,
    previous,
    delta,
    percentChange,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

function formatSigned(value) {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function summarizeTrend(metrics) {
  const improved = metrics.filter((metric) => metric.delta > 0).map((metric) => metric.label.toLowerCase());
  const declined = metrics.filter((metric) => metric.delta < 0).map((metric) => metric.label.toLowerCase());

  if (improved.length === 0 && declined.length === 0) {
    return "No major movement across tracked metrics.";
  }

  if (declined.length === 0) {
    return `Improved in ${improved.join(", ")}.`;
  }

  if (improved.length === 0) {
    return `Dip observed in ${declined.join(", ")}.`;
  }

  return `Improved in ${improved.join(", ")}; focus on ${declined.join(", ")}.`;
}

function buildWeekSnapshot(offset, scopedNutritionLogs, scopedRunningSessions, scopedSleepLogs, scopedWorkouts, targets) {
  const weekData = filterRecordsForWeek(scopedNutritionLogs, offset);
  const runningData = filterRecordsForWeek(scopedRunningSessions, offset);
  const sleepData = filterRecordsForWeek(scopedSleepLogs, offset);
  const workoutData = filterRecordsForWeek(scopedWorkouts, offset);

  const weekNutrition = sumNutrition(weekData);
  const totalDistanceKm = round(sumRunningDistance(runningData));
  const totalWorkoutDuration = sumWorkoutDuration(workoutData);
  const totalSleepHours = sumSleepHours(sleepData);

  const daysInWeek = 7;
  const avgProtein = round(weekNutrition.protein / daysInWeek);
  const avgCalories = round(weekNutrition.calories / daysInWeek);
  const avgSleep = round(totalSleepHours / daysInWeek);
  const avgRunningDistance = round(totalDistanceKm / daysInWeek);
  const workoutFrequency = round(workoutData.length / daysInWeek);

  const performanceDetails = buildPerformanceExplanation({
    protein: avgProtein,
    calories: avgCalories,
    workoutCount: workoutFrequency,
    runningDistanceKm: avgRunningDistance,
    sleepHours: avgSleep,
    targets,
  });

  const rangeWindow = getWeekWindow(offset);
  const weekTitle = formatDateRange(rangeWindow.start, rangeWindow.end);
  let prefix = weekTitle;
  if (offset === 0) {
    prefix = "This Week";
  } else if (offset === -1) {
    prefix = "Last Week";
  }

  const displayLabel = offset > -2 ? `${prefix} (${weekTitle})` : weekTitle;

  return {
    id: `week-${offset}`,
    offset,
    title: displayLabel,
    dateRange: weekTitle,
    totalWorkouts: workoutData.length,
    totalWorkoutDuration,
    totalRunningDistance: totalDistanceKm,
    avgProtein,
    avgCalories,
    avgSleep,
    performanceScore: performanceDetails.score,
    performanceExplanation: performanceDetails.summary,
    performanceBreakdown: performanceDetails.breakdown,
    strongestArea: performanceDetails.strongestArea,
    limitingArea: performanceDetails.limitingArea,
  };
}

function buildDaySnapshot(offset, scopedNutritionLogs, scopedRunningSessions, scopedSleepLogs, scopedWorkouts, targets) {
  const dayNutrition = filterRecordsForDay(scopedNutritionLogs, offset);
  const dayRunning = filterRecordsForDay(scopedRunningSessions, offset);
  const daySleep = filterRecordsForDay(scopedSleepLogs, offset);
  const dayWorkouts = filterRecordsForDay(scopedWorkouts, offset);

  const nutritionTotal = sumNutrition(dayNutrition);
  const runningDistanceKm = round(sumRunningDistance(dayRunning));
  const sleepHours = round(sumSleepHours(daySleep));

  return {
    protein: round(nutritionTotal.protein),
    calories: round(nutritionTotal.calories),
    workouts: dayWorkouts.length,
    runningDistanceKm,
    sleepHours,
    performanceScore: calculatePerformanceScore({
      protein: round(nutritionTotal.protein),
      calories: round(nutritionTotal.calories),
      workoutCount: dayWorkouts.length,
      runningDistanceKm,
      sleepHours,
      targets,
    }),
  };
}

function buildTrends(today, yesterday, currentWeek, previousWeek) {
  const todayMetrics = [
    buildTrendMetric("Protein", today.protein, yesterday.protein, "g"),
    buildTrendMetric("Calories", today.calories, yesterday.calories, " kcal"),
    buildTrendMetric("Running", today.runningDistanceKm, yesterday.runningDistanceKm, " km"),
    buildTrendMetric("Workouts", today.workouts, yesterday.workouts, " sessions"),
    buildTrendMetric("Sleep", today.sleepHours, yesterday.sleepHours, " h"),
  ];

  const weekMetrics = [
    buildTrendMetric("Protein Avg", currentWeek.avgProtein, previousWeek.avgProtein, "g"),
    buildTrendMetric("Calories Avg", currentWeek.avgCalories, previousWeek.avgCalories, " kcal"),
    buildTrendMetric("Running Total", currentWeek.totalRunningDistance, previousWeek.totalRunningDistance, " km"),
    buildTrendMetric("Workouts Total", currentWeek.totalWorkouts, previousWeek.totalWorkouts, " sessions"),
    buildTrendMetric("Sleep Avg", currentWeek.avgSleep, previousWeek.avgSleep, " h"),
  ];

  return {
    generatedAt: new Date().toISOString(),
    todayVsYesterday: {
      metrics: todayMetrics,
      performanceScore: buildTrendMetric("Performance Score", today.performanceScore, yesterday.performanceScore, ""),
      summary: summarizeTrend(todayMetrics),
    },
    weekVsWeek: {
      currentWeekLabel: currentWeek.title,
      previousWeekLabel: previousWeek.title,
      metrics: weekMetrics,
      performanceScore: buildTrendMetric("Performance Score", currentWeek.performanceScore, previousWeek.performanceScore, ""),
      summary: summarizeTrend(weekMetrics),
    },
  };
}

async function buildWeeklyReportPayload(req) {
  const athleteId = req.user?.sub;
  const currentUser = await getCurrentUser(req);
  const macroPlan = buildMacroPlan(currentUser?.profile || {});
  const targets = macroPlan.dailyTargets;

  const [liveNutritionLogs, liveRunningSessions, liveSleepLogs, liveWorkouts] = await Promise.all([
    listRecords({ model: NutritionLog, fallback: nutritionLogs }),
    listRecords({ model: RunningData, fallback: runningSessions }),
    listRecords({ model: SleepLog, fallback: sleepLogs }),
    listRecords({ model: Workout, fallback: workouts }),
  ]);

  const scopedNutritionLogs = filterByAthlete(liveNutritionLogs, athleteId);
  const scopedRunningSessions = filterByAthlete(liveRunningSessions, athleteId);
  const scopedSleepLogs = filterByAthlete(liveSleepLogs, athleteId);
  const scopedWorkouts = filterByAthlete(liveWorkouts, athleteId);

  const weekOffsets = [0, -1, -2, -3];
  const weeklyReports = weekOffsets.map((offset) =>
    buildWeekSnapshot(offset, scopedNutritionLogs, scopedRunningSessions, scopedSleepLogs, scopedWorkouts, targets)
  );

  const reportMap = new Map(weeklyReports.map((report) => [report.offset, report]));
  const today = buildDaySnapshot(0, scopedNutritionLogs, scopedRunningSessions, scopedSleepLogs, scopedWorkouts, targets);
  const yesterday = buildDaySnapshot(
    -1,
    scopedNutritionLogs,
    scopedRunningSessions,
    scopedSleepLogs,
    scopedWorkouts,
    targets
  );

  return {
    athleteName: currentUser?.name || "Athlete",
    reports: weeklyReports,
    trends: buildTrends(today, yesterday, reportMap.get(0), reportMap.get(-1)),
  };
}

function writeMetricLines(doc, metrics) {
  metrics.forEach((metric) => {
    const percentText = metric.percentChange === null ? "n/a" : `${formatSigned(metric.percentChange)}%`;
    doc.text(
      `${metric.label}: ${metric.current}${metric.unit} (prev ${metric.previous}${metric.unit}, ${formatSigned(
        metric.delta
      )}${metric.unit}, ${percentText})`
    );
  });
}

function createPdf({ doc, athleteName, currentWeek, previousWeek, trends }) {
  const generatedDate = new Date(trends.generatedAt).toLocaleString("en-US");

  doc.fontSize(22).text("Athlytic Weekly Performance Report");
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#4b5563").text(`Athlete: ${athleteName}`);
  doc.text(`Generated: ${generatedDate}`);
  doc.text(`Report Window: ${currentWeek.dateRange}`);

  doc.moveDown(1.1);
  doc.fillColor("#111827").fontSize(16).text(`Performance Score: ${currentWeek.performanceScore}/100`);
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor("#374151").text(currentWeek.performanceExplanation);

  doc.moveDown(0.8);
  doc.fillColor("#111827").fontSize(14).text("Today vs Yesterday");
  doc.moveDown(0.2);
  writeMetricLines(doc, trends.todayVsYesterday.metrics);
  doc.text(
    `Score: ${trends.todayVsYesterday.performanceScore.current} (delta ${formatSigned(
      trends.todayVsYesterday.performanceScore.delta
    )})`
  );
  doc.text(`Summary: ${trends.todayVsYesterday.summary}`);

  doc.moveDown(0.8);
  doc.fontSize(14).fillColor("#111827").text("Week vs Week");
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor("#374151").text(`${currentWeek.title} vs ${previousWeek.title}`);
  writeMetricLines(doc, trends.weekVsWeek.metrics);
  doc.text(`Score: ${currentWeek.performanceScore} vs ${previousWeek.performanceScore}`);
  doc.text(`Summary: ${trends.weekVsWeek.summary}`);

  doc.moveDown(0.8);
  doc.fontSize(14).fillColor("#111827").text("Current Week Core Totals");
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor("#374151").text(`Workouts: ${currentWeek.totalWorkouts}`);
  doc.text(`Workout duration: ${currentWeek.totalWorkoutDuration} mins`);
  doc.text(`Running distance: ${currentWeek.totalRunningDistance} km`);
  doc.text(`Avg protein: ${currentWeek.avgProtein} g/day`);
  doc.text(`Avg calories: ${currentWeek.avgCalories} kcal/day`);
  doc.text(`Avg sleep: ${currentWeek.avgSleep} h/day`);
}

router.get("/weekly", protect, async (req, res) => {
  try {
    const payload = await buildWeeklyReportPayload(req);
    res.json({
      reports: payload.reports,
      trends: payload.trends,
    });
  } catch (error) {
    console.error("Weekly Reports Error:", error);
    res.status(500).json({ message: `Backend Error: ${error.message}` });
  }
});

router.get("/weekly/pdf", protect, async (req, res) => {
  try {
    const payload = await buildWeeklyReportPayload(req);
    const currentWeek = payload.reports.find((report) => report.offset === 0) || payload.reports[0];
    const previousWeek = payload.reports.find((report) => report.offset === -1) || payload.reports[1];

    const fileDate = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="athlytic-weekly-report-${fileDate}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 44 });
    doc.pipe(res);

    createPdf({
      doc,
      athleteName: payload.athleteName,
      currentWeek,
      previousWeek,
      trends: payload.trends,
    });

    doc.end();
  } catch (error) {
    console.error("Weekly Report PDF Error:", error);
    res.status(500).json({ message: `Backend Error: ${error.message}` });
  }
});

module.exports = router;
