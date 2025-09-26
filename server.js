require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Database init
const { initializeDatabase } = require("./src/database/init");

// Routes and middleware
const authRoutes = require("./src/routes/auth");
const notesRoutes = require("./src/routes/notes");
const tenantsRoutes = require("./src/routes/tenants");
const { authenticateToken } = require("./src/middleware/auth");

const app = express();

// Security & body parsing
app.use(helmet());
app.use(cors()); // In this demo, allow all origins. You can restrict with ALLOWED_ORIGINS env.
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
  // If request looks like API (already handled), skip
  if (req.path.startsWith("/api")) return next();
  // If a direct file exists (e.g., CSS/JS), let static middleware handle it
  if (req.path.includes(".")) return next();
  return res.sendFile(path.join(publicDir, "index.html"));
});

const port = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
