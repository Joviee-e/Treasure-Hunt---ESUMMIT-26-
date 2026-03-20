"use strict";
/**
 * Auth routes: login, team CRUD, reset
 */
const express = require("express");
const bcrypt  = require("bcrypt");
const router  = express.Router();

const Team        = require("../models/Team");
const EscapeQueue = require("../models/EscapeQueue");
const { Assignment, Progress } = require("../models/Legacy");
const { SALT_ROUNDS }          = require("../utils/config");
const { toUiTeam }             = require("../utils/serialize");
const { checkAndFailIfExpired } = require("../utils/timer");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function ensureLegacyDocs(teamId) {
  const blankProgress = {
    teamId, currentClue: 1, startedAt: null, completedClues: [], finished: false,
    finishedAt: null, escapeStatus: null, escapeQueuedAt: null, escapeStartedAt: null,
    escapeFinishedAt: null, escapeHintsUsed: 0, escapePuzzlesSolved: [],
  };
  await Promise.all([
    Assignment.findOneAndUpdate({ teamId }, { $setOnInsert: { teamId, clues: [] } }, { upsert: true }),
    Progress.findOneAndUpdate(  { teamId }, { $setOnInsert: blankProgress },          { upsert: true }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/login
// ─────────────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { teamName, password } = req.body || {};
    if (!teamName || !password)
      return res.status(400).json({ error: "teamName and password required" });

    const name = String(teamName).trim().toUpperCase();
    const team = await Team.findOne({ name });
    if (!team) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(String(password), team.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // ── Operators bypass all game checks ──────────────────────────────────────
    if (team.role === "operator") {
      console.log("  ↳ OPERATOR LOGIN");
      return res.json({ user: toUiTeam(team) });
    }

    // ── Hard block for eliminated teams ───────────────────────────────────────
    if (team.game_state === "FAILED") {
      return res.status(403).json({
        error : "GAME OVER",
        reason: team.failure_reason || "Your team has been eliminated.",
      });
    }

    // ── Check if an in-progress timer has run out ─────────────────────────────
    const nowFailed = await checkAndFailIfExpired(team);
    if (nowFailed) {
      return res.status(403).json({ error: "GAME OVER", reason: "TIME_EXPIRED" });
    }

    // ── Ensure legacy helper docs exist ───────────────────────────────────────
    await ensureLegacyDocs(team._id);

    console.log(`  ↳ LOGIN OK – ${name}`);
    res.json({ user: toUiTeam(team) });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teams
// ─────────────────────────────────────────────────────────────────────────────
router.get("/teams", async (_req, res) => {
  try {
    const teams = await Team.find({ role: { $ne: "operator" } }).sort({ createdAt: 1 });
    res.json({ teams: teams.map(toUiTeam) });
  } catch (err) {
    console.error("[teams]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team — create a team
// ─────────────────────────────────────────────────────────────────────────────
router.post("/team", async (req, res) => {
  try {
    const { teamName, password } = req.body || {};
    if (!teamName || !password)
      return res.status(400).json({ error: "teamName and password required" });

    const name = String(teamName).trim().toUpperCase();
    if (name === "OPERATOR") return res.status(400).json({ error: "Reserved team name" });

    const existing = await Team.findOne({ name });
    if (existing) return res.status(409).json({ error: "Team already exists" });

    const hash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const team = await Team.create({
      name, password: hash, role: "team", game_state: "NOT_STARTED", is_active: true,
    });

    await ensureLegacyDocs(team._id);
    console.log(`  ↳ Team CREATED: ${name}`);
    res.json({ team: toUiTeam(team) });
  } catch (err) {
    console.error("[create-team]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/team/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/team/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByIdAndDelete(id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    await Promise.all([
      Assignment.deleteMany({ teamId: id }),
      Progress.deleteMany({ teamId: id }),
      EscapeQueue.deleteOne({ team_id: id }),
    ]);
    console.log(`  ↳ Team DELETED: ${team.name}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[delete-team]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reset-team — full wipe back to NOT_STARTED
// ─────────────────────────────────────────────────────────────────────────────
router.post("/reset-team", async (req, res) => {
  try {
    const { teamId } = req.body || {};
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.role === "operator") return res.status(400).json({ error: "Cannot reset operator" });

    // Reset all game state
    Object.assign(team, {
      game_state           : "NOT_STARTED",
      is_active            : true,
      failure_reason       : null,
      treasure_start_time  : null,
      treasure_end_time    : null,
      escape_start_time    : null,
      escape_end_time      : null,
      final_submission_time: null,
      current_clue_index   : 0,
      completed_clues      : [],
      // legacy
      status                 : "queued",
      treasure_hunt_completed: false,
      escape_room_started    : false,
      escape_room_completed  : false,
    });
    await team.save();

    const blankProgress = {
      currentClue: 1, startedAt: null, completedClues: [], finished: false, finishedAt: null,
      escapeStatus: null, escapeQueuedAt: null, escapeStartedAt: null, escapeFinishedAt: null,
      escapeHintsUsed: 0, escapePuzzlesSolved: [],
    };
    await Promise.all([
      Progress.findOneAndUpdate({ teamId }, { $set: blankProgress }, { upsert: true }),
      EscapeQueue.deleteOne({ team_id: teamId }),
    ]);

    console.log(`  ↳ TEAM RESET: ${team.name}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[reset-team]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
