// ============================================================
// MATRIXX – Production Backend  (Refactored)
// ============================================================
"use strict";

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const bcrypt   = require("bcrypt");
const path     = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Team = require("./models/Team");
const Clue = require("./models/Clue");
const { SALT_ROUNDS, OPERATOR_NAME, OPERATOR_PASSWORD, DEFAULT_VAULT_CODE } = require("./utils/config");

const authRoutes   = require("./routes/auth");
const gameRoutes   = require("./routes/game");
const escapeRoutes = require("./routes/escape");
const adminRoutes  = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const body =
    req.body && Object.keys(req.body).length
      ? JSON.stringify({
          ...req.body,
          qrImage: req.body.qrImage ? "[BASE64_IMAGE]" : undefined,
        })
      : "";
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, body || "");
  next();
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS         : 45_000,
  })
  .then(async () => {
    console.log("✅  MongoDB Connected");
    await seedOperator();
    await seedVaultCode();
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });

mongoose.connection.on("disconnected", () => console.warn("⚠️  MongoDB disconnected"));
mongoose.connection.on("reconnected",  () => console.log("✅  MongoDB reconnected"));

// ── Seed functions ────────────────────────────────────────────────────────────
async function seedOperator() {
  const existing = await Team.findOne({ name: OPERATOR_NAME });
  if (!existing) {
    const hash = await bcrypt.hash(OPERATOR_PASSWORD, SALT_ROUNDS);
    await Team.create({ name: OPERATOR_NAME, password: hash, role: "operator", game_state: "NOT_STARTED" });
    console.log(`✅  OPERATOR account created  (username: ${OPERATOR_NAME} | password: ${OPERATOR_PASSWORD})`);
  } else {
    console.log("ℹ️   OPERATOR account already exists");
  }
}

async function seedVaultCode() {
  const existing = await Clue.findOne({ title: "__VAULT__" });
  if (!existing) {
    await Clue.create({
      title: "__VAULT__", description: "Escape Room Vault Code",
      validationCode: DEFAULT_VAULT_CODE, hint: "", difficulty: "", qrPayload: "", qrImage: "",
    });
    console.log(`✅  Default vault code created: ${DEFAULT_VAULT_CODE}`);
  } else {
    console.log("ℹ️   Vault code exists:", existing.validationCode);
  }
}

// ── Background timer sweep ────────────────────────────────────────────────────
// Catches teams that ran out of time without making a request (e.g. tab closed)
const { checkAndFailIfExpired } = require("./utils/timer");
setInterval(async () => {
  try {
    const active = await Team.find({
      game_state: { $in: ["TREASURE_HUNT", "ESCAPE_ACTIVE"] },
      is_active : true,
    });
    for (const team of active) {
      await checkAndFailIfExpired(team);
    }
  } catch (err) {
    console.error("[timer-sweep]", err.message);
  }
}, 30_000);   // every 30 seconds

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", authRoutes);
app.use("/api", gameRoutes);
app.use("/api", escapeRoutes);
app.use("/api", adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any synchronous throw that bypassed a try/catch
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("─────────────────────────────────────────────");
  console.log(`🚀  MATRIXX server running on port ${PORT}`);
  console.log(`📡  ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log("─────────────────────────────────────────────");
});
