const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    bodyRegion: { type: String, default: "Other", trim: true },
    sets: { type: Number, min: 1 },
    reps: { type: Number, min: 1 },
    weightLifted: { type: Number, min: 0 },
    restSeconds: { type: Number, min: 0, max: 1800 },
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    focus: { type: String, required: true },
    bodyRegion: String,
    sets: Number,
    reps: Number,
    weightLifted: Number,
    totalLoadKg: Number,
    averageSetWeightKg: Number,
    durationMinutes: Number,
    intensity: String,
    exercises: [exerciseSchema],
    loggedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Workout || mongoose.model("Workout", workoutSchema);
