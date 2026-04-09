const DEFAULT_DAILY_TARGETS = {
  calories: 2500,
  protein: 170,
  carbs: 250,
  fats: 75,
  waterLiters: 3.5,
  sleepHours: 8,
  runningDistanceKm: 5,
};

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.55,
  high: 1.75,
  elite: 1.95,
};

const GOAL_CALORIE_OFFSET = {
  fat_loss: -400,
  maintenance: 0,
  muscle_gain: 250,
  endurance: 200,
};

const GOAL_PROTEIN_PER_KG = {
  fat_loss: 2.2,
  maintenance: 1.8,
  muscle_gain: 2.0,
  endurance: 1.7,
};

const GOAL_CARB_PER_KG = {
  fat_loss: 2.5,
  maintenance: 3.5,
  muscle_gain: 4.5,
  endurance: 5.5,
};

const GOAL_FAT_RATIO = {
  fat_loss: 0.28,
  maintenance: 0.27,
  muscle_gain: 0.25,
  endurance: 0.22,
};

const ACTIVITY_CARB_BONUS = {
  sedentary: 0,
  light: 10,
  moderate: 20,
  high: 35,
  elite: 50,
};

const ACTIVITY_WATER_BONUS = {
  sedentary: 0.2,
  light: 0.35,
  moderate: 0.5,
  high: 0.75,
  elite: 1,
};

function toValidNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n;]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function roundToOneDecimal(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function roundToInteger(value) {
  return Math.round(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hasMeaningfulProfile(profile) {
  return Boolean(toValidNumber(profile.age) && toValidNumber(profile.weight) && toValidNumber(profile.height));
}

function buildDietSuggestions({ dietaryPreference, goalType, allergies, proteinTarget }) {
  const allergyText = allergies.length > 0 ? `Avoid: ${allergies.join(", ")}.` : "No allergy restrictions saved.";
  const goalTextByType = {
    fat_loss: "Focus on high-volume whole foods to keep hunger low while staying in a deficit.",
    maintenance: "Keep meal timing consistent and distribute protein across the day.",
    muscle_gain: "Add one calorie-dense snack around training to support lean mass gain.",
    endurance: "Prioritize carb timing before and after hard running sessions.",
  };

  const preferenceLower = cleanText(dietaryPreference).toLowerCase();
  const baseOptions = {
    vegan: [
      "Breakfast: overnight oats + soy yogurt + chia + berries.",
      "Lunch: lentil quinoa bowl with mixed vegetables and tahini.",
      "Dinner: tofu stir-fry with rice and edamame.",
      "Snack: roasted chickpeas + fruit.",
    ],
    vegetarian: [
      "Breakfast: greek yogurt parfait with oats and berries.",
      "Lunch: paneer or tofu wrap with salad and hummus.",
      "Dinner: dal + rice + mixed vegetables.",
      "Snack: cottage cheese or milk smoothie + nuts.",
    ],
    pescatarian: [
      "Breakfast: eggs + toast + fruit.",
      "Lunch: salmon rice bowl with greens and avocado.",
      "Dinner: grilled fish + potatoes + vegetables.",
      "Snack: yogurt + banana + seeds.",
    ],
    keto: [
      "Breakfast: eggs, avocado, and sauteed vegetables.",
      "Lunch: chicken salad with olive oil dressing and nuts.",
      "Dinner: fish or paneer with low-carb vegetables.",
      "Snack: greek yogurt or cheese with seeds.",
    ],
    default: [
      "Breakfast: eggs or yogurt, oats, and fruit.",
      "Lunch: lean protein + rice/roti + vegetables.",
      "Dinner: chicken/fish/paneer + carbs + greens.",
      "Snack: whey or yogurt + nuts + fruit.",
    ],
  };

  const dietLines = baseOptions[preferenceLower] || baseOptions.default;

  return [
    `Protein target is ${proteinTarget}g daily. Split into 3 to 5 feedings for better recovery.`,
    goalTextByType[goalType] || goalTextByType.maintenance,
    allergyText,
    ...dietLines,
  ];
}

function buildAiAdvice({ profile, targets, bmi }) {
  const advice = [];
  const injuries = cleanText(profile.recentInjuries);
  const illness = cleanText(profile.recentIllness);
  const allergies = normalizeList(profile.allergies);
  const preference = cleanText(profile.dietaryPreference);

  advice.push(
    `Based on your profile, start with ${targets.calories} kcal and macros ${targets.protein}P / ${targets.carbs}C / ${targets.fats}F each day.`
  );

  if (bmi) {
    advice.push(`Estimated BMI is ${bmi}. Use weekly trend changes, not one-day changes, to adjust calories.`);
  }

  if (injuries) {
    advice.push("Injury noted. Keep protein high, prioritize sleep, and include omega-3 rich foods for recovery support.");
  }

  if (illness) {
    advice.push("Recent illness noted. Keep hydration high and prioritize easy-to-digest meals while symptoms settle.");
  }

  if (allergies.length > 0) {
    advice.push(`Allergy-aware plan enabled: ${allergies.join(", ")}.`);
  }

  if (preference) {
    advice.push(`Diet preference detected: ${preference}. Meal suggestions are adapted to this preference.`);
  }

  advice.push(`Hydration goal is ${targets.waterLiters}L and sleep goal is ${targets.sleepHours}h for performance support.`);

  return advice;
}

function buildMacroPlan(profile = {}) {
  const age = toValidNumber(profile.age);
  const weight = toValidNumber(profile.weight);
  const height = toValidNumber(profile.height);
  const sex = cleanText(profile.sex) || "other";
  const activityLevel = cleanText(profile.activityLevel) || "moderate";
  const goalType = cleanText(profile.goalType) || "maintenance";
  const hasInjury = Boolean(cleanText(profile.recentInjuries));
  const hasIllness = Boolean(cleanText(profile.recentIllness));
  const allergies = normalizeList(profile.allergies);
  const dietaryPreference = cleanText(profile.dietaryPreference) || "default";

  if (!hasMeaningfulProfile(profile)) {
    return {
      hasEnoughProfileData: false,
      dailyTargets: DEFAULT_DAILY_TARGETS,
      estimatedBmr: null,
      estimatedTdee: null,
      bmi: null,
      aiAdvice: [
        "Add age, weight, and height in Profile to unlock fully personalized macros.",
        "Using starter targets for now: 2500 kcal, 170g protein, 250g carbs, 75g fats.",
      ],
      dietSuggestions: buildDietSuggestions({
        dietaryPreference,
        goalType,
        allergies,
        proteinTarget: DEFAULT_DAILY_TARGETS.protein,
      }),
    };
  }

  const normalizedActivity = ACTIVITY_FACTORS[activityLevel] ? activityLevel : "moderate";
  const normalizedGoal = GOAL_CALORIE_OFFSET[goalType] !== undefined ? goalType : "maintenance";

  const sexOffset = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  const estimatedBmr = roundToInteger(10 * weight + 6.25 * height - 5 * age + sexOffset);
  const estimatedTdee = roundToInteger(estimatedBmr * ACTIVITY_FACTORS[normalizedActivity]);
  const targetCalories = clamp(
    roundToInteger(estimatedTdee + GOAL_CALORIE_OFFSET[normalizedGoal]),
    1200,
    5200
  );

  const proteinPerKg =
    GOAL_PROTEIN_PER_KG[normalizedGoal] + (hasInjury ? 0.2 : 0) + (hasIllness ? 0.15 : 0);
  const protein = roundToInteger(weight * proteinPerKg);

  const fatByRatio = (targetCalories * GOAL_FAT_RATIO[normalizedGoal]) / 9;
  const fatByMinimum = weight * 0.8;
  const fats = roundToInteger(Math.max(fatByRatio, fatByMinimum));

  const carbMinimum = weight * GOAL_CARB_PER_KG[normalizedGoal] + ACTIVITY_CARB_BONUS[normalizedActivity];
  const caloriesAfterProteinAndFat = targetCalories - protein * 4 - fats * 9;
  let carbs = roundToInteger(Math.max(carbMinimum, caloriesAfterProteinAndFat / 4));
  carbs = Math.max(100, carbs);

  const recalculatedCalories = protein * 4 + carbs * 4 + fats * 9;
  if (Math.abs(targetCalories - recalculatedCalories) > 120) {
    carbs += roundToInteger((targetCalories - recalculatedCalories) / 4);
  }

  let waterLiters = weight * 0.035 + ACTIVITY_WATER_BONUS[normalizedActivity];
  if (hasIllness) {
    waterLiters += 0.4;
  }

  const bmi = roundToOneDecimal(weight / ((height / 100) * (height / 100)));
  const dailyTargets = {
    calories: targetCalories,
    protein,
    carbs: Math.max(80, carbs),
    fats: Math.max(30, fats),
    waterLiters: roundToOneDecimal(waterLiters),
    sleepHours: normalizedGoal === "endurance" ? 8.5 : 8,
    runningDistanceKm: normalizedGoal === "endurance" ? 8 : 5,
  };

  return {
    hasEnoughProfileData: true,
    dailyTargets,
    estimatedBmr,
    estimatedTdee,
    bmi,
    aiAdvice: buildAiAdvice({
      profile,
      targets: dailyTargets,
      bmi,
    }),
    dietSuggestions: buildDietSuggestions({
      dietaryPreference,
      goalType: normalizedGoal,
      allergies,
      proteinTarget: dailyTargets.protein,
    }),
  };
}

module.exports = {
  DEFAULT_DAILY_TARGETS,
  buildMacroPlan,
  normalizeList,
};
