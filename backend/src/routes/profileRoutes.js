const express = require("express");
const { protect } = require("../middleware/auth");
const { getCurrentUser, saveCurrentUser } = require("../utils/currentUser");
const { buildMacroPlan, normalizeList } = require("../utils/macroPlanner");

const router = express.Router();

function sanitizeNumber(value, { min, max } = {}) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  if (min !== undefined && parsed < min) {
    return min;
  }

  if (max !== undefined && parsed > max) {
    return max;
  }

  return parsed;
}

function sanitizeText(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();
  return text.length > 0 ? text : "";
}

function buildProfileUpdates(rawProfile = {}) {
  const updates = {};
  const sport = sanitizeText(rawProfile.sport);
  const goalsSummary = sanitizeText(rawProfile.goalsSummary);
  const recentIllness = sanitizeText(rawProfile.recentIllness);
  const recentInjuries = sanitizeText(rawProfile.recentInjuries);
  const dietaryPreference = sanitizeText(rawProfile.dietaryPreference);
  const medicalNotes = sanitizeText(rawProfile.medicalNotes);
  const sex = sanitizeText(rawProfile.sex);
  const activityLevel = sanitizeText(rawProfile.activityLevel);
  const goalType = sanitizeText(rawProfile.goalType);
  const age = sanitizeNumber(rawProfile.age, { min: 12, max: 90 });
  const weight = sanitizeNumber(rawProfile.weight, { min: 25, max: 250 });
  const height = sanitizeNumber(rawProfile.height, { min: 120, max: 230 });
  const bodyFatPercent = sanitizeNumber(rawProfile.bodyFatPercent, { min: 2, max: 70 });

  if (sport !== undefined) updates.sport = sport;
  if (goalsSummary !== undefined) updates.goalsSummary = goalsSummary;
  if (recentIllness !== undefined) updates.recentIllness = recentIllness;
  if (recentInjuries !== undefined) updates.recentInjuries = recentInjuries;
  if (dietaryPreference !== undefined) updates.dietaryPreference = dietaryPreference;
  if (medicalNotes !== undefined) updates.medicalNotes = medicalNotes;
  if (sex !== undefined) updates.sex = sex;
  if (activityLevel !== undefined) updates.activityLevel = activityLevel;
  if (goalType !== undefined) updates.goalType = goalType;
  if (age !== undefined) updates.age = age;
  if (weight !== undefined) updates.weight = weight;
  if (height !== undefined) updates.height = height;
  if (bodyFatPercent !== undefined) updates.bodyFatPercent = bodyFatPercent;

  if (rawProfile.allergies !== undefined) {
    updates.allergies = normalizeList(rawProfile.allergies);
  }

  return updates;
}

function toPublicUser(user) {
  return {
    id: user._id ? String(user._id) : user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile || {},
  };
}

router.use(protect);

router.get("/me", async (req, res) => {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return res.status(404).json({ message: "User account not found." });
  }

  return res.json({
    user: toPublicUser(currentUser),
    macroPlan: buildMacroPlan(currentUser.profile || {}),
  });
});

router.put("/me", async (req, res) => {
  const payload = req.body || {};
  const requestedName = sanitizeText(payload.name);
  const profileUpdates = buildProfileUpdates(payload.profile || payload);
  const updates = {};

  if (requestedName !== undefined) {
    updates.name = requestedName;
  }

  if (Object.keys(profileUpdates).length > 0) {
    updates.profile = profileUpdates;
  }

  if (Object.keys(updates).length === 0) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "User account not found." });
    }

    return res.json({
      user: toPublicUser(currentUser),
      macroPlan: buildMacroPlan(currentUser.profile || {}),
    });
  }

  const updatedUser = await saveCurrentUser(req, updates);
  if (!updatedUser) {
    return res.status(404).json({ message: "User account not found." });
  }

  return res.json({
    user: toPublicUser(updatedUser),
    macroPlan: buildMacroPlan(updatedUser.profile || {}),
  });
});

module.exports = router;
