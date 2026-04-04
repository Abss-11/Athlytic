const bcrypt = require("bcryptjs");

const sampleUsers = [
  {
    id: "ath-1",
    name: "Jordan Lee",
    email: "demo@athlytic.app",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "athlete",
    profile: {
      sport: "Hybrid athlete",
      age: 27,
      weight: 78,
      height: 181,
      goalsSummary: "Build pace and maintain strength output.",
    },
  },
  {
    id: "coach-1",
    name: "Coach Riley",
    email: "coach@athlytic.app",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "coach",
    profile: {
      sport: "Performance coaching",
      goalsSummary: "Manage athlete readiness and programming.",
    },
  },
];

const workouts = [
];

const nutritionLogs = [
];

const runningSessions = [
];

const goals = [
];

const achievements = [
];

const communityPosts = [
];

const dashboardSummary = {
  athlete: {
    performanceScore: 0,
    waterLiters: 0,
    sleepHours: 0,
    weeklyWorkoutSummary: {
      sessions: 0,
      totalMinutes: 0,
      runningKm: 0,
    },
    aiInsights: [],
  },
  coach: {
    monitoredAthletes: 0,
    flaggedAthletes: 0,
    averageCompliance: 0,
    notes: [],
  },
};

module.exports = {
  sampleUsers,
  workouts,
  nutritionLogs,
  runningSessions,
  goals,
  achievements,
  communityPosts,
  dashboardSummary,
};
