function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value) {
  const parsed = parseNumber(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return null;
}

function parseText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseStringList(value) {
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

function addError(errors, field, message) {
  errors.push({ field, message });
}

function isAllowedValue(value, allowedValues) {
  return allowedValues.includes(value);
}

function parseNumberField({
  raw,
  key,
  fieldName = key,
  min = null,
  max = null,
  integer = false,
  required = false,
  errors,
  target,
}) {
  const hasValue = raw[key] !== undefined && raw[key] !== null && raw[key] !== "";

  if (!hasValue) {
    if (required) {
      addError(errors, fieldName, `${fieldName} is required.`);
    }
    return;
  }

  const parsed = integer ? parseInteger(raw[key]) : parseNumber(raw[key]);
  if (parsed === null) {
    addError(errors, fieldName, `${fieldName} must be a valid ${integer ? "integer" : "number"}.`);
    return;
  }

  if (min !== null && parsed < min) {
    addError(errors, fieldName, `${fieldName} must be at least ${min}.`);
    return;
  }

  if (max !== null && parsed > max) {
    addError(errors, fieldName, `${fieldName} must be at most ${max}.`);
    return;
  }

  target[key] = parsed;
}

function validateNutritionInput(raw = {}, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const mealName = parseText(raw.mealName);
  const hasMealName = raw.mealName !== undefined;

  if (!partial || hasMealName) {
    if (!mealName) {
      addError(errors, "mealName", "mealName is required.");
    } else if (mealName.length > 120) {
      addError(errors, "mealName", "mealName must be 120 characters or fewer.");
    } else {
      data.mealName = mealName;
    }
  }

  parseNumberField({
    raw,
    key: "calories",
    min: 0,
    max: 12000,
    required: !partial,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "protein",
    min: 0,
    max: 1000,
    required: !partial,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "carbs",
    min: 0,
    max: 1500,
    required: false,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "fats",
    min: 0,
    max: 500,
    required: false,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "waterLiters",
    min: 0,
    max: 15,
    required: false,
    errors,
    target: data,
  });

  if (!partial || raw.carbs !== undefined) {
    if (data.carbs === undefined && raw.carbs === undefined) {
      data.carbs = 0;
    }
  }

  if (!partial || raw.fats !== undefined) {
    if (data.fats === undefined && raw.fats === undefined) {
      data.fats = 0;
    }
  }

  if (!partial || raw.waterLiters !== undefined) {
    if (data.waterLiters === undefined && raw.waterLiters === undefined) {
      data.waterLiters = 0;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

function validateWorkoutInput(raw = {}, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const focus = parseText(raw.focus);
  const hasFocus = raw.focus !== undefined;

  if (!partial || hasFocus) {
    if (!focus) {
      addError(errors, "focus", "focus is required.");
    } else if (focus.length > 120) {
      addError(errors, "focus", "focus must be 120 characters or fewer.");
    } else {
      data.focus = focus;
    }
  }

  parseNumberField({
    raw,
    key: "sets",
    min: 1,
    max: 100,
    integer: true,
    required: !partial,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "reps",
    min: 1,
    max: 300,
    integer: true,
    required: !partial,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "weightLifted",
    min: 0,
    max: 2000,
    required: false,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "durationMinutes",
    min: 1,
    max: 720,
    required: false,
    errors,
    target: data,
  });

  if (raw.bodyRegion !== undefined) {
    const bodyRegion = parseText(raw.bodyRegion);
    if (bodyRegion.length > 100) {
      addError(errors, "bodyRegion", "bodyRegion must be 100 characters or fewer.");
    } else {
      data.bodyRegion = bodyRegion;
    }
  }

  if (raw.intensity !== undefined) {
    const intensity = parseText(raw.intensity);
    if (intensity.length > 30) {
      addError(errors, "intensity", "intensity must be 30 characters or fewer.");
    } else {
      data.intensity = intensity;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

function validateRunningInput(raw = {}, { partial = false } = {}) {
  const errors = [];
  const data = {};

  parseNumberField({
    raw,
    key: "distanceKm",
    min: 0.1,
    max: 300,
    required: !partial,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "durationMinutes",
    min: 1,
    max: 1440,
    required: false,
    errors,
    target: data,
  });
  parseNumberField({
    raw,
    key: "vo2Max",
    min: 10,
    max: 100,
    required: false,
    errors,
    target: data,
  });

  const hasPace = raw.pace !== undefined;
  const pace = parseText(raw.pace);
  if (!partial || hasPace) {
    if (!pace) {
      addError(errors, "pace", "pace is required.");
    } else if (pace.length > 40) {
      addError(errors, "pace", "pace must be 40 characters or fewer.");
    } else {
      data.pace = pace;
    }
  }

  if (raw.personalRecord !== undefined) {
    const personalRecord = parseBoolean(raw.personalRecord);
    if (personalRecord === null) {
      addError(errors, "personalRecord", "personalRecord must be true or false.");
    } else {
      data.personalRecord = personalRecord;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

function validateSleepInput(raw = {}, { partial = false } = {}) {
  const errors = [];
  const data = {};

  parseNumberField({
    raw,
    key: "hours",
    min: 0.1,
    max: 24,
    required: !partial,
    errors,
    target: data,
  });

  if (raw.note !== undefined) {
    const note = parseText(raw.note);
    if (note.length > 400) {
      addError(errors, "note", "note must be 400 characters or fewer.");
    } else {
      data.note = note;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

function validateProfileInput(raw = {}) {
  const errors = [];
  const data = {};
  const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : raw;
  const allowedSex = ["male", "female", "other"];
  const allowedActivity = ["sedentary", "light", "moderate", "high", "elite"];
  const allowedGoal = ["fat_loss", "maintenance", "muscle_gain", "endurance"];
  const allowedPreference = ["none", "vegetarian", "vegan", "pescatarian", "keto"];

  if (raw.name !== undefined) {
    const name = parseText(raw.name);
    if (!name) {
      addError(errors, "name", "name cannot be empty.");
    } else if (name.length > 80) {
      addError(errors, "name", "name must be 80 characters or fewer.");
    } else {
      data.name = name;
    }
  }

  const profileData = {};
  const stringFieldRules = [
    { key: "sport", max: 80 },
    { key: "goalsSummary", max: 350 },
    { key: "recentIllness", max: 350 },
    { key: "recentInjuries", max: 350 },
    { key: "medicalNotes", max: 500 },
  ];

  for (const field of stringFieldRules) {
    if (profile[field.key] !== undefined) {
      const text = parseText(profile[field.key]);
      if (text.length > field.max) {
        addError(errors, field.key, `${field.key} must be ${field.max} characters or fewer.`);
      } else {
        profileData[field.key] = text;
      }
    }
  }

  parseNumberField({
    raw: profile,
    key: "age",
    min: 12,
    max: 90,
    integer: true,
    required: false,
    errors,
    target: profileData,
  });
  parseNumberField({
    raw: profile,
    key: "weight",
    min: 25,
    max: 250,
    required: false,
    errors,
    target: profileData,
  });
  parseNumberField({
    raw: profile,
    key: "height",
    min: 120,
    max: 230,
    required: false,
    errors,
    target: profileData,
  });
  parseNumberField({
    raw: profile,
    key: "bodyFatPercent",
    min: 2,
    max: 70,
    required: false,
    errors,
    target: profileData,
  });

  if (profile.sex !== undefined) {
    const sex = parseText(profile.sex).toLowerCase();
    if (!isAllowedValue(sex, allowedSex)) {
      addError(errors, "sex", `sex must be one of: ${allowedSex.join(", ")}.`);
    } else {
      profileData.sex = sex;
    }
  }

  if (profile.activityLevel !== undefined) {
    const activityLevel = parseText(profile.activityLevel).toLowerCase();
    if (!isAllowedValue(activityLevel, allowedActivity)) {
      addError(
        errors,
        "activityLevel",
        `activityLevel must be one of: ${allowedActivity.join(", ")}.`
      );
    } else {
      profileData.activityLevel = activityLevel;
    }
  }

  if (profile.goalType !== undefined) {
    const goalType = parseText(profile.goalType).toLowerCase();
    if (!isAllowedValue(goalType, allowedGoal)) {
      addError(errors, "goalType", `goalType must be one of: ${allowedGoal.join(", ")}.`);
    } else {
      profileData.goalType = goalType;
    }
  }

  if (profile.dietaryPreference !== undefined) {
    const dietaryPreference = parseText(profile.dietaryPreference).toLowerCase();
    if (!isAllowedValue(dietaryPreference, allowedPreference)) {
      addError(
        errors,
        "dietaryPreference",
        `dietaryPreference must be one of: ${allowedPreference.join(", ")}.`
      );
    } else {
      profileData.dietaryPreference = dietaryPreference;
    }
  }

  if (profile.allergies !== undefined) {
    const allergies = parseStringList(profile.allergies);
    if (allergies.some((entry) => entry.length > 50)) {
      addError(errors, "allergies", "Each allergy entry must be 50 characters or fewer.");
    } else {
      profileData.allergies = allergies;
    }
  }

  if (Object.keys(profileData).length > 0) {
    data.profile = profileData;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

module.exports = {
  validateNutritionInput,
  validateWorkoutInput,
  validateRunningInput,
  validateSleepInput,
  validateProfileInput,
};
