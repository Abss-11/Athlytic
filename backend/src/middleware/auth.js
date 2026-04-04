const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "athlytic-dev-secret");
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }
}

module.exports = { protect };
