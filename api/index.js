const app = require("../backend/src/app");
const connectDatabase = require("../backend/src/config/db");

module.exports = async (req, res) => {
  if (!connectDatabase.isDatabaseConnected()) {
    await connectDatabase();
  }
  return app(req, res);
};
