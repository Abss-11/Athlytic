const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const runningRoutes = require("./routes/runningRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const goalRoutes = require("./routes/goalRoutes");
const communityRoutes = require("./routes/communityRoutes");

const app = express();
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasBuiltFrontend = fs.existsSync(frontendIndexPath);

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/api", (_req, res) => {
  res.json({
    name: "Athlytic API",
    status: "healthy",
    modules: ["auth", "dashboard", "nutrition", "running", "workouts", "goals", "community"],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/running", runningRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/community", communityRoutes);

if (hasBuiltFrontend) {
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      message: "Athlytic frontend build not found. Run `npm run build:full` from the project root.",
      api: "/api",
    });
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || "Unexpected server error",
  });
});

module.exports = app;
