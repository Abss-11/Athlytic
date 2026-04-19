const express = require("express");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { sampleUsers } = require("../data/sampleData");
const User = require("../models/User");
const { isDatabaseConnected } = require("../config/db");

const router = express.Router();
const supportedRoles = new Set(["athlete", "coach"]);

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emailMatcher(normalizedEmail) {
  return new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i");
}

router.post("/register", async (req, res) => {
  const { name, email, password, role, sport } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role || "").trim().toLowerCase();
  const trimmedName = String(name || "").trim();

  if (!trimmedName) {
    return res.status(400).json({ message: "Name is required." });
  }

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required." });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  if (!supportedRoles.has(normalizedRole)) {
    return res.status(400).json({ message: "Role must be athlete or coach." });
  }

  const existingDatabaseUser = isDatabaseConnected() ? await User.findOne({ email: emailMatcher(normalizedEmail) }) : null;
  const existingFallbackUser = sampleUsers.find((entry) => normalizeEmail(entry.email) === normalizedEmail);
  const existingUser = existingDatabaseUser || existingFallbackUser;

  if (existingUser) {
    const existingRole = existingUser.role || "athlete";
    if (existingRole !== normalizedRole) {
      return res
        .status(409)
        .json({ message: `This email is already registered as ${existingRole}. Switch role at login or use another email.` });
    }

    return res.status(409).json({ message: "An account already exists for this email and role." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: `user-${sampleUsers.length + 1}`,
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    role: normalizedRole,
    profile: {
      sport,
    },
  };

  let savedUser = newUser;

  try {
    if (isDatabaseConnected()) {
      savedUser = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        role: normalizedRole,
        profile: {
          sport,
        },
      });
    } else {
      sampleUsers.push(newUser);
    }
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account already exists for this email." });
    }

    throw error;
  }

  res.status(201).json({
    token: generateToken(savedUser),
    user: {
      id: savedUser._id ? String(savedUser._id) : savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      profile: savedUser.profile,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  if (!supportedRoles.has(normalizedRole)) {
    return res.status(400).json({ message: "Role must be athlete or coach." });
  }

  let user = null;

  if (isDatabaseConnected()) {
    user = await User.findOne({ email: emailMatcher(normalizedEmail) }).lean();
  }

  if (!user) {
    user = sampleUsers.find((entry) => normalizeEmail(entry.email) === normalizedEmail);
  }

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.role !== normalizedRole) {
    return res
      .status(401)
      .json({ message: `This email is registered as ${user.role}. Switch role to ${user.role} and try again.` });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const normalizedUserEmail = normalizeEmail(user.email);
  if (isDatabaseConnected() && user._id && user.email !== normalizedUserEmail) {
    await User.updateOne({ _id: user._id }, { $set: { email: normalizedUserEmail } });
    user.email = normalizedUserEmail;
  }

  return res.json({
    token: generateToken(user),
    user: {
      id: user._id ? String(user._id) : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  });
});

module.exports = router;
