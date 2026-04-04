const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["protein", "calories", "gym", "running", "bodyWeight", "strength"],
      required: true,
    },
    targetValue: Number,
    currentValue: Number,
    unit: String,
    deadline: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Goal || mongoose.model("Goal", goalSchema);
