require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// IMPORTANT: Avoid importing DB at module load in serverless
let initializeDatabase = null;

// Routes and middleware
const authRoutes = require("./src/routes/auth");
const notesRoutes = require("./src/routes/notes");
const tenantsRoutes = require("./src/routes/tenants");
const { authenticateToken } = require("./src/middleware/auth");

const app = express();

// Security & body parsing
app.use(helmet());
app.use(cors()); // Allow all origins for demo; restrict via ALLOWED_ORIGINS in production
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Ensure DB is initialized before handling API routes (safe for serverless)
let dbInitialized = false;
let dbInitError = null;
async function ensureDbInitialized() {
  if (dbInitialized || dbInitError) return;
  try {
    if (!initializeDatabase) {
      // Lazy require to catch native module issues gracefully
      ({ initializeDatabase } = require("./src/database/init"));
    }
    await initializeDatabase();
    dbInitialized = true;
  } catch (e) {
    dbInitError = e;
    console.error("Database initialization failed:", e);
  }
}

// Lazy init middleware to avoid cold-start crashes on Vercel
app.use(async (req, res, next) => {
  if (!dbInitialized && !dbInitError) {
    await ensureDbInitialized();
  }
  if (dbInitError) {
    return res.status(500).json({ error: "Database initialization failed" });
  }
  return next();
});

// API routes
app.use("/auth", authRoutes);
app.use("/notes", authenticateToken, notesRoutes);
app.use("/tenants", authenticateToken, tenantsRoutes);

// Serve static frontend
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Root path should serve the app UI
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Fallback: for any other non-API path, serve index.html (supports client-side routing)
app.get(["/health", "/auth/*", "/notes/*", "/tenants/*", "/:any*"], (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (req.path.includes(".")) return next();
  return res.sendFile(path.join(publicDir, "index.html"));
});

const isVercel = !!process.env.VERCEL || !!process.env.NOW_REGION;
const port = process.env.PORT || 3000;

if (isVercel) {
  // Export an explicit handler for Vercel Serverless Functions
  module.exports = (req, res) => app(req, res);
  // Kick off DB init on cold start (best-effort)
  ensureDbInitialized();
} else {
  // Local/dev server with listener
  ensureDbInitialized()
    .finally(() => {
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
      });
    });
}
