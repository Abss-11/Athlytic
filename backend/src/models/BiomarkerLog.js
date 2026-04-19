
const mongoose = require("mongoose");

const biomarkerLogSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    ferritin: { type: Number },
    vitaminD: { type: Number },
    cortisol: { type: Number },
    testosterone: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.BiomarkerLog || mongoose.model("BiomarkerLog", biomarkerLogSchema);
