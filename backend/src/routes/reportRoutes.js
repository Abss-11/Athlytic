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
const focusTipByMetric = {
  protein: "Increase protein in the first two meals to stabilize daily intake.",
  calories: "Pre-plan one calorie-dense recovery meal post-workout to hit target consistently.",
  workouts: "Block training sessions on calendar in advance to improve completion rate.",
  running: "Add one short quality run and one easy volume run this week.",
  sleep: "Set a fixed sleep window and reduce screen exposure 45 minutes before bed.",
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

function getScoreBand(score) {
  if (score >= 85) {
    return "Elite";
  }
  if (score >= 70) {
    return "Strong";
  }
  if (score >= 50) {
    return "Developing";
  }
  return "Foundation";
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
    scoreBand: getScoreBand(performanceDetails.score),
    focusTip: focusTipByMetric[performanceDetails.limitingArea.key] || "Maintain a consistent daily routine this week.",
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

function formatMetricValue(metric, key = "current") {
  return `${metric[key]}${metric.unit || ""}`;
}

function formatPercentChange(metric) {
  if (metric.percentChange === null) {
    return "new";
  }
  return `${formatSigned(metric.percentChange)}%`;
}

function ensurePageSpace(doc, y, requiredHeight, topMargin = 44, bottomMargin = 44) {
  const available = doc.page.height - bottomMargin;
  if (y + requiredHeight <= available) {
    return y;
  }

  doc.addPage();
  return topMargin;
}

function drawHeaderCard(doc, x, y, width, payload, currentWeek) {
  const generatedDate = new Date(payload.trends.generatedAt).toLocaleString("en-US");
  const score = currentWeek.performanceScore;

  doc.save();
  doc.roundedRect(x, y, width, 104, 14).fill("#0f172a");
  doc.roundedRect(x + 1, y + 1, width - 2, 102, 14).strokeColor("#1e3a8a").lineWidth(1).stroke();
  doc.restore();

  doc.fillColor("#93c5fd").fontSize(10).text("ATHLYTIC WEEKLY PERFORMANCE REPORT", x + 20, y + 16);
  doc.fillColor("#f8fafc").fontSize(20).text(payload.athleteName, x + 20, y + 30, { width: width - 190 });
  doc.fillColor("#cbd5e1").fontSize(10).text(`Generated: ${generatedDate}`, x + 20, y + 58);
  doc.text(`Window: ${currentWeek.dateRange}`, x + 20, y + 72);

  const scoreCardWidth = 120;
  const scoreCardX = x + width - scoreCardWidth - 18;
  doc.roundedRect(scoreCardX, y + 18, scoreCardWidth, 68, 12).fill("#111827");
  doc.strokeColor("#334155").lineWidth(1).roundedRect(scoreCardX, y + 18, scoreCardWidth, 68, 12).stroke();

  doc.fillColor("#94a3b8").fontSize(9).text("PERFORMANCE SCORE", scoreCardX + 10, y + 28, {
    width: scoreCardWidth - 20,
    align: "center",
  });
  doc.fillColor("#a3e635").fontSize(24).text(`${score}`, scoreCardX + 10, y + 42, {
    width: scoreCardWidth - 20,
    align: "center",
  });
}

function drawSummaryCard(doc, x, y, width, currentWeek, previousWeek) {
  doc.roundedRect(x, y, width, 82, 12).fill("#f8fafc");
  doc.strokeColor("#e2e8f0").lineWidth(1).roundedRect(x, y, width, 82, 12).stroke();

  doc.fillColor("#0f172a").fontSize(14).text(`Score Band: ${currentWeek.scoreBand}`, x + 16, y + 14);
  doc.fillColor("#334155").fontSize(10).text(currentWeek.performanceExplanation, x + 16, y + 34, { width: width - 32 });
  doc.fillColor("#1d4ed8").fontSize(10).text(`Focus: ${currentWeek.focusTip}`, x + 16, y + 60, { width: width - 32 });

  const delta = currentWeek.performanceScore - previousWeek.performanceScore;
  doc.fillColor("#334155").fontSize(10).text(
    `Week-over-week score: ${formatSigned(delta)} (${currentWeek.performanceScore} vs ${previousWeek.performanceScore})`,
    x + width - 220,
    y + 14,
    { width: 200, align: "right" }
  );
}

function drawTrendTable(doc, x, y, width, title, subtitle, trendBlock) {
  const rowHeight = 24;
  const tableRows = trendBlock.metrics.length + 1;
  const cardHeight = 62 + tableRows * rowHeight + 30;

  doc.roundedRect(x, y, width, cardHeight, 12).fill("#ffffff");
  doc.strokeColor("#e2e8f0").lineWidth(1).roundedRect(x, y, width, cardHeight, 12).stroke();

  doc.fillColor("#0f172a").fontSize(13).text(title, x + 16, y + 14);
  doc.fillColor("#64748b").fontSize(9).text(subtitle, x + 16, y + 31, { width: width - 32 });
  doc.fillColor("#334155").fontSize(9).text(`Summary: ${trendBlock.summary}`, x + 16, y + 44, { width: width - 32 });

  const tableY = y + 62;
  const colMetric = x + 16;
  const colCurrent = x + width * 0.44;
  const colPrev = x + width * 0.63;
  const colDelta = x + width * 0.78;

  doc.rect(x + 12, tableY, width - 24, rowHeight).fill("#f1f5f9");
  doc.fillColor("#334155").fontSize(8).text("Metric", colMetric, tableY + 8);
  doc.text("Current", colCurrent, tableY + 8);
  doc.text("Previous", colPrev, tableY + 8);
  doc.text("Delta", colDelta, tableY + 8);

  trendBlock.metrics.forEach((metric, index) => {
    const rowY = tableY + rowHeight * (index + 1);
    if (index % 2 === 0) {
      doc.rect(x + 12, rowY, width - 24, rowHeight).fill("#f8fafc");
    }
    doc.fillColor("#0f172a").fontSize(9).text(metric.label, colMetric, rowY + 7);
    doc.fillColor("#334155").text(formatMetricValue(metric), colCurrent, rowY + 7);
    doc.text(formatMetricValue(metric, "previous"), colPrev, rowY + 7);
    doc.text(`${formatSigned(metric.delta)}${metric.unit} (${formatPercentChange(metric)})`, colDelta, rowY + 7, {
      width: width - (colDelta - x) - 18,
    });
  });

  return cardHeight;
}

function drawBreakdownCard(doc, x, y, width, breakdown) {
  const rowHeight = 30;
  const cardHeight = 48 + breakdown.length * rowHeight + 20;
  doc.roundedRect(x, y, width, cardHeight, 12).fill("#ffffff");
  doc.strokeColor("#e2e8f0").lineWidth(1).roundedRect(x, y, width, cardHeight, 12).stroke();
  doc.fillColor("#0f172a").fontSize(13).text("Performance Breakdown", x + 16, y + 14);

  breakdown.forEach((item, index) => {
    const rowY = y + 44 + index * rowHeight;
    doc.fillColor("#334155").fontSize(9).text(item.label, x + 16, rowY + 3);
    doc.fillColor("#0f172a").fontSize(9).text(`${item.score}/100`, x + width - 60, rowY + 3, { width: 44, align: "right" });

    const barX = x + 16;
    const barY = rowY + 16;
    const barWidth = width - 90;
    doc.roundedRect(barX, barY, barWidth, 8, 4).fill("#e2e8f0");
    doc.roundedRect(barX, barY, (barWidth * Math.max(0, Math.min(100, item.score))) / 100, 8, 4).fill("#3b82f6");
  });

  return cardHeight;
}

function drawCoreTotalsCard(doc, x, y, width, currentWeek) {
  const cardHeight = 152;
  doc.roundedRect(x, y, width, cardHeight, 12).fill("#ffffff");
  doc.strokeColor("#e2e8f0").lineWidth(1).roundedRect(x, y, width, cardHeight, 12).stroke();
  doc.fillColor("#0f172a").fontSize(13).text("Current Week Core Totals", x + 16, y + 14);

  const metrics = [
    ["Workouts", `${currentWeek.totalWorkouts}`],
    ["Workout Duration", `${currentWeek.totalWorkoutDuration} mins`],
    ["Running Distance", `${currentWeek.totalRunningDistance} km`],
    ["Avg Protein", `${currentWeek.avgProtein} g/day`],
    ["Avg Calories", `${currentWeek.avgCalories} kcal/day`],
    ["Avg Sleep", `${currentWeek.avgSleep} h/day`],
  ];

  metrics.forEach(([label, value], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const cellX = x + 16 + col * ((width - 40) / 2);
    const cellY = y + 42 + row * 34;
    doc.fillColor("#64748b").fontSize(8).text(label, cellX, cellY);
    doc.fillColor("#0f172a").fontSize(10).text(value, cellX, cellY + 11, { width: (width - 52) / 2 });
  });

  return cardHeight;
}

function createPdf({ doc, athleteName, currentWeek, previousWeek, trends }) {
  const pageWidth = doc.page.width - 88;
  const startX = 44;
  let y = 44;

  drawHeaderCard(doc, startX, y, pageWidth, { athleteName, trends }, currentWeek);
  y += 118;

  drawSummaryCard(doc, startX, y, pageWidth, currentWeek, previousWeek);
  y += 96;

  y = ensurePageSpace(doc, y, 220);
  const todayHeight = drawTrendTable(
    doc,
    startX,
    y,
    pageWidth,
    "Today vs Yesterday",
    "Daily movement snapshot",
    trends.todayVsYesterday
  );
  y += todayHeight + 14;

  y = ensurePageSpace(doc, y, 220);
  const weekHeight = drawTrendTable(
    doc,
    startX,
    y,
    pageWidth,
    "Week vs Week",
    `${currentWeek.title} against ${previousWeek.title}`,
    trends.weekVsWeek
  );
  y += weekHeight + 14;

  y = ensurePageSpace(doc, y, 200);
  const breakdownHeight = drawBreakdownCard(doc, startX, y, pageWidth, currentWeek.performanceBreakdown);
  y += breakdownHeight + 14;

  y = ensurePageSpace(doc, y, 170);
  drawCoreTotalsCard(doc, startX, y, pageWidth, currentWeek);

  doc.fillColor("#94a3b8").fontSize(8).text("Generated by Athlytic Performance OS", startX, doc.page.height - 28);
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
