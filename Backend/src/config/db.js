// src/config/db.js — MongoDB connection via Mongoose
const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (!uri) {
    console.error(
      "❌ MONGODB_URI is missing. Add it to Backend/.env or the project root .env, e.g.\n" +
        "   MONGODB_URI=mongodb://127.0.0.1:27017/credaura\n" +
        "   or your Atlas connection string."
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB connected: ${conn.connection.host} → ${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected.");
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;