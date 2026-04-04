const mongoose = require("mongoose");

const runningDataSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    distanceKm: Number,
    durationMinutes: Number,
    pace: String,
    vo2Max: Number,
    personalRecord: Boolean,
    loggedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.RunningData || mongoose.model("RunningData", runningDataSchema);
