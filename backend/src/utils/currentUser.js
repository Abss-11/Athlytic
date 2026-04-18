const { sampleUsers } = require("../data/sampleData");
const User = require("../models/User");
const { isDatabaseConnected } = require("../config/db");
const { normalizeDocument } = require("./persistence");

async function getCurrentUser(req) {
  const userId = req.user?.sub;
  const userEmail = req.user?.email;

  if (isDatabaseConnected()) {
    let user = null;

    if (userId) {
      user = await User.findById(userId);
    }

    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    if (user) {
      return normalizeDocument(user);
    }
  }

  return (
    sampleUsers.find((entry) => (userId && entry.id === userId) || (userEmail && entry.email === userEmail)) ||
    null
  );
}

async function saveCurrentUser(req, updates) {
  const userId = req.user?.sub;
  const userEmail = req.user?.email;

  if (isDatabaseConnected()) {
    let user = null;

    if (userId) {
      user = await User.findById(userId);
    }

    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    if (user) {
      if (updates.name !== undefined) {
        user.name = updates.name;
      }

      if (updates.profile) {
        const currentProfile = user.profile ? user.profile.toObject() : {};
        user.profile = {
          ...currentProfile,
          ...updates.profile,
        };
      }

      await user.save();
      return normalizeDocument(user);
    }
  }

  const fallbackUser = sampleUsers.find(
    (entry) => (userId && entry.id === userId) || (userEmail && entry.email === userEmail)
  );

  if (!fallbackUser) {
    return null;
  }

  if (updates.name !== undefined) {
    fallbackUser.name = updates.name;
  }

  if (updates.profile) {
    fallbackUser.profile = {
      ...(fallbackUser.profile || {}),
      ...updates.profile,
    };
  }

  return fallbackUser;
}

module.exports = {
  getCurrentUser,
  saveCurrentUser,
};
