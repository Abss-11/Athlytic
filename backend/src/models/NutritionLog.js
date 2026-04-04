const mongoose = require("mongoose");

const nutritionLogSchema = new mongoose.Schema(
  {
    athleteId: { type: String, required: true },
    mealName: { type: String, required: true },
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    waterLiters: Number,
    loggedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.NutritionLog || mongoose.model("NutritionLog", nutritionLogSchema);
