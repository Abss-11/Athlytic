const express = require("express");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { sampleUsers } = require("../data/sampleData");
const User = require("../models/User");
const { isDatabaseConnected } = require("../config/db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role, sport } = req.body;

  const existingUser = isDatabaseConnected()
    ? await User.findOne({ email, role })
    : sampleUsers.find((entry) => entry.email === email && entry.role === role);
  if (existingUser) {
    return res.status(409).json({ message: "An account already exists for this email and role." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: `user-${sampleUsers.length + 1}`,
    name,
    email,
    passwordHash,
    role,
    profile: {
      sport,
    },
  };

  let savedUser = newUser;

  if (isDatabaseConnected()) {
    savedUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      profile: {
        sport,
      },
    });
  } else {
    sampleUsers.push(newUser);
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
  const user = isDatabaseConnected()
    ? await User.findOne({ email, role }).lean()
    : sampleUsers.find((entry) => entry.email === email && entry.role === role);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
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
