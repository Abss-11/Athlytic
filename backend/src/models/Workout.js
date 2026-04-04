const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    focus: { type: String, required: true },
    bodyRegion: String,
    sets: Number,
    reps: Number,
    weightLifted: Number,
    durationMinutes: Number,
    intensity: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Workout || mongoose.model("Workout", workoutSchema);
