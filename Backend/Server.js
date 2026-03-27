// server.js  — CredAura Backend Entry Point
require("dotenv").config();
const express       = require("express");
const cors          = require("cors");
const helmet        = require("helmet");
const morgan        = require("morgan");
const rateLimit     = require("express-rate-limit");

const connectDB     = require("./src/config/db");
const errorHandler  = require("./src/middleware/errorHandler");
const cronService   = require("./src/services/cronService");

// Routes 
const authRoutes     = require("./src/routes/auth");
const lenderRoutes   = require("./src/routes/lender");
const borrowerRoutes = require("./src/routes/borrower");
const loanRoutes     = require("./src/routes/loan");
const creditRoutes   = require("./src/routes/credit");

// Connect Database
connectDB();

const app = express();

// Security Middleware
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
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

// ── Start Cron Jobs ───────────────────────────────────────────────────────────
cronService.startAll();

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CredAura Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Polygon RPC: ${process.env.POLYGON_RPC_URL}`);
  console.log(`📦 Contract:   ${process.env.CONTRACT_ADDRESS}\n`);
});

module.exports = app;