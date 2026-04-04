const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log("MONGODB_URI not provided. Starting Athlytic API with mock in-memory data.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.warn("MongoDB connection failed. Starting Athlytic API with mock in-memory data instead.");
    console.warn(error.message);
  }
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = connectDatabase;
module.exports.isDatabaseConnected = isDatabaseConnected;
