const mongoose = require("mongoose");

const sleepLogSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    hours: { type: Number, required: true },
    note: String,
    loggedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.SleepLog || mongoose.model("SleepLog", sleepLogSchema);
