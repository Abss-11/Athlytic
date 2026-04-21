const app = require("../backend/src/app");
const connectDatabase = require("../backend/src/config/db");

module.exports = async (req, res) => {
  const requestUrl = new URL(req.url, "https://athlytic.local");
  const rewrittenPath = requestUrl.searchParams.get("path");

  if (rewrittenPath !== null) {
    const normalizedPath = String(rewrittenPath).replace(/^\/+/, "");
    req.url = normalizedPath ? `/api/${normalizedPath}` : "/api";
  } else if (!req.url.startsWith("/api")) {
    req.url = req.url === "/" ? "/api" : `/api${req.url}`;
  }

  if (!connectDatabase.isDatabaseConnected()) {
    await connectDatabase();
  }
  return app(req, res);
};
