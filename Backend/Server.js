// server.js  — CredAura Backend Entry Point
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express       = require("express");
const cors          = require("cors");
const helmet        = require("helmet");
const morgan        = require("morgan");
const rateLimit     = require("express-rate-limit");

const connectDB     = require("./src/config/db");
const errorHandler  = require("./src/Middleware/errorHandler");
const cronService   = require("./src/Services/cronService");

// Routes
const authRoutes     = require("./src/Routes/auth");
const lenderRoutes   = require("./src/Routes/lender");
const borrowerRoutes = require("./src/Routes/borrower");
const loanRoutes     = require("./src/Routes/loan");
const creditRoutes   = require("./src/Routes/credit");

const app = express();

// Security Middleware
app.use(helmet());

const defaultOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
    : defaultOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate Limiting 
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logger (dev only) ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "CredAura API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/lender",   lenderRoutes);
app.use("/api/borrower", borrowerRoutes);
app.use("/api/loan",     loanRoutes);
app.use("/api/credit",   creditRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  cronService.startAll();

  app.listen(PORT, () => {
    console.log(`\n🚀 CredAura Backend running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log(`🍃 MongoDB:     connected`);
    console.log(`🔗 Polygon RPC: ${process.env.POLYGON_RPC_URL || "(not set)"}`);
    console.log(`📦 Contract:   ${process.env.CONTRACT_ADDRESS || "(not set)"}\n`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});

module.exports = app;