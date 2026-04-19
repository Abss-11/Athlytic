const express = require("express");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const { sampleUsers } = require("../data/sampleData");
const { isDatabaseConnected } = require("../config/db");
const { normalizeDocument } = require("../utils/persistence");

const router = express.Router();

router.use(protect);

function toPublicUser(user) {
  return {
    id: user._id ? String(user._id) : user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile || {},
  };
}

router.get("/athletes", async (req, res) => {
  let athletes = [];

  if (isDatabaseConnected()) {
    const dbAthletes = await User.find({ role: "athlete" });
    athletes = dbAthletes.map(normalizeDocument);
  } else {
    athletes = sampleUsers.filter((u) => u.role === "athlete");
  }

  res.json({
    athletes: athletes.map(toPublicUser),
  });
});

router.put("/athletes/:id/notes", async (req, res) => {
  const { notes } = req.body;
  const { id } = req.params;

  let targetUser = null;

  if (isDatabaseConnected()) {
    targetUser = await User.findById(id);
    if (targetUser && targetUser.role === "athlete") {
      const currentProfile = targetUser.profile && typeof targetUser.profile.toObject === 'function' 
        ? targetUser.profile.toObject() 
        : (targetUser.profile || {});
      targetUser.profile = { ...currentProfile, medicalNotes: notes };
      await targetUser.save();
      targetUser = normalizeDocument(targetUser);
    } else {
      targetUser = null;
    }
  } else {
    targetUser = sampleUsers.find((u) => u.id === id && u.role === "athlete");
    if (targetUser) {
      targetUser.profile = { ...(targetUser.profile || {}), medicalNotes: notes };
    }
  }

  if (!targetUser) {
    return res.status(404).json({ message: "Athlete not found." });
  }

  res.json({
    message: "Notes updated successfully",
    athlete: toPublicUser(targetUser),
  });
});

module.exports = router;
