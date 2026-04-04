const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    sport: String,
    age: Number,
    weight: Number,
    height: Number,
    goalsSummary: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["athlete", "coach"], required: true },
    profile: profileSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
