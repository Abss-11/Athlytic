require("dotenv").config();
const app = require("./src/app");
const connectDatabase = require("./src/config/db");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, HOST, () => {
    console.log(`Athlytic API running on http://${HOST}:${PORT}`);
  });

  server.on("error", (error) => {
    console.error("Athlytic API failed to bind", error);
    process.exit(1);
  });

  return server;
}

startServer().catch((error) => {
  console.error("Failed to start Athlytic API", error);
  process.exit(1);
});
