const jwt = require("jsonwebtoken");

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id || user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || "athlytic-dev-secret",
    {
      expiresIn: "7d",
    }
  );
}

module.exports = generateToken;
