const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    label: { type: String, required: true },
    description: String,
    icon: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Achievement || mongoose.model("Achievement", achievementSchema);
