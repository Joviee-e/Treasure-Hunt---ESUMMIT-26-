"use strict";
/**
 * Escape room routes: queue, start, end, vault submission
 */
const express     = require("express");
const router      = express.Router();

const Team        = require("../models/Team");
const Clue        = require("../models/Clue");
const EscapeQueue = require("../models/EscapeQueue");
const { Progress } = require("../models/Legacy");
const { toUiTeam }               = require("../utils/serialize");
const { checkAndFailIfExpired, failTeam } = require("../utils/timer");

function timerActiveForState(state) {
  return state === "TREASURE_HUNT" || state === "ESCAPE_ACTIVE";
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queue-status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/queue-status", async (_req, res) => {
  try {
    const entries = await EscapeQueue.find().sort({ queue_position: 1 }).lean();
    const teamIds = entries.map(e => e.team_id);
    const teams   = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = Object.fromEntries(teams.map(t => [String(t._id), t]));

    res.json({
      queue: entries.map(e => ({
        team_id       : String(e.team_id),
        team_name     : teamMap[String(e.team_id)]?.name || "Unknown",
        status        : e.status,
        queue_position: e.queue_position,
        started_at    : e.started_at || null,
        ended_at      : e.ended_at   || null,
        is_timer_active: timerActiveForState(teamMap[String(e.team_id)]?.game_state || "NOT_STARTED"),
      })), 
    });
  } catch (err) {
    console.error("[queue-status]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/start-escape  — OPERATOR triggers escape room start for a team
// ─────────────────────────────────────────────────────────────────────────────
router.post("/start-escape", async (req, res) => {
  try {
    const { teamId } = req.body || {};
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (!["WAITING_ESCAPE", "ESCAPE_ACTIVE"].includes(team.game_state))
      return res.status(400).json({ error: "Team is not in escape queue (game_state: " + team.game_state + ")" });

    // Idempotent
    if (team.game_state === "ESCAPE_ACTIVE")
      return res.json({ ok: true, message: "Already active", user: toUiTeam(team) });

    const now = new Date();
    // Atomic: only transition from WAITING_ESCAPE
    const updated = await Team.findOneAndUpdate(
      { _id: teamId, game_state: "WAITING_ESCAPE" },
      {
        $set: {
          game_state           : "ESCAPE_ACTIVE",
          escape_start_time    : now,
          escape_room_started  : true,
          status               : "escape_active",
        },
      },
      { new: true }
    );

    if (!updated) {
      const fresh = await Team.findById(teamId);
      return res.json({ ok: true, message: "State already transitioned", user: toUiTeam(fresh) });
    }

    await EscapeQueue.findOneAndUpdate(
      { team_id: teamId },
      { $set: { status: "ACTIVE", started_at: now } },
      { upsert: true }
    );
    await Progress.findOneAndUpdate(
      { teamId },
      { $set: { escapeStatus: "active", escapeStartedAt: now } },
      { upsert: true }
    );

    console.log(`  ↳ ESCAPE STARTED: ${team.name}`);
    res.json({ ok: true, user: toUiTeam(updated) });
  } catch (err) {
    console.error("[start-escape]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/end-escape  — OPERATOR manually ends escape (COMPLETED or FAILED)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/end-escape", async (req, res) => {
  try {
    const { teamId, outcome } = req.body || {};
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const now      = new Date();
    const markFail = String(outcome || "").toUpperCase() === "FAILED";

    if (markFail) {
      await failTeam(team, "OPERATOR_ENDED");
    } else {
      await Team.findByIdAndUpdate(teamId, {
        $set: {
          game_state            : "COMPLETED",
          escape_end_time       : now,
          final_submission_time : now,
          is_active             : false,
          escape_room_completed : true,
          escape_room_started   : true,
          status                : "escape_completed",
        },
      });
    }

    await EscapeQueue.findOneAndUpdate(
      { team_id: teamId },
      { $set: { status: markFail ? "FAILED" : "DONE", ended_at: now } }
    );
    await Progress.findOneAndUpdate(
      { teamId },
      { $set: { escapeStatus: markFail ? "failed" : "finished", escapeFinishedAt: now } },
      { upsert: true }
    );

    const fresh = await Team.findById(teamId);
    console.log(`  ↳ ESCAPE ENDED: ${team.name} → ${markFail ? "FAILED" : "COMPLETED"}`);
    res.json({ ok: true, user: toUiTeam(fresh) });
  } catch (err) {
    console.error("[end-escape]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/submit-escape-code — TEAM submits vault code
// POST /api/escape-finish      — legacy alias
// ─────────────────────────────────────────────────────────────────────────────
async function handleVaultSubmit(req, res) {
  try {
    const { teamId, code } = req.body || {};
    if (!teamId || !code)
      return res.status(400).json({ error: "teamId and code required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Block permanently failed teams
    if (team.game_state === "FAILED")
      return res.status(403).json({ error: "GAME OVER", reason: team.failure_reason });

    // Already completed → idempotent success
    if (team.game_state === "COMPLETED")
      return res.json({ valid: true, alreadyCompleted: true });

    // Check expiry
    const nowFailed = await checkAndFailIfExpired(team);
    if (nowFailed)
      return res.status(403).json({ error: "GAME OVER", reason: "TIME_EXPIRED" });

    if (team.game_state !== "ESCAPE_ACTIVE")
      return res.status(400).json({ error: "Escape room is not active for your team" });

    // Resolve vault code: per-team override → global default
    let expectedCode;
    if (team.vault_code) {
      expectedCode = String(team.vault_code).toUpperCase().trim();
    } else {
      const v = await Clue.findOne({ title: "__VAULT__" });
      if (!v) return res.status(500).json({ error: "Vault code not configured. Contact operator." });
      expectedCode = String(v.validationCode).toUpperCase().trim();
    }

    const entered = String(code).trim().toUpperCase();
    if (entered !== expectedCode) {
      console.log(`  ↳ VAULT WRONG: ${team.name} entered "${entered}"`);
      return res.json({ valid: false });
    }

    // ── SUCCESS ───────────────────────────────────────────────────────────────
    const now = new Date();
    // Atomic: only if still ESCAPE_ACTIVE
    const updated = await Team.findOneAndUpdate(
      { _id: teamId, game_state: "ESCAPE_ACTIVE" },
      {
        $set: {
          game_state            : "COMPLETED",
          escape_end_time       : now,
          final_submission_time : now,
          is_active             : false,
          escape_room_completed : true,
          escape_room_started   : true,
          status                : "escape_completed",
        },
      },
      { new: true }
    );

    await EscapeQueue.findOneAndUpdate(
      { team_id: teamId },
      { $set: { status: "DONE", ended_at: now } }
    );
    await Progress.findOneAndUpdate(
      { teamId },
      { $set: { escapeStatus: "finished", escapeFinishedAt: now } },
      { upsert: true }
    );

    console.log(`  ↳ VAULT SUCCESS: ${team.name} → COMPLETED`);
    res.json({ valid: true, escapeFinishedAt: now });
  } catch (err) {
    console.error("[vault-submit]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

router.post("/submit-escape-code", handleVaultSubmit);
router.post("/escape-finish",      handleVaultSubmit);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/escape-queue — legacy operator UI sets status + hints + puzzles
// ─────────────────────────────────────────────────────────────────────────────
router.post("/escape-queue", async (req, res) => {
  try {
    const { teamId, status, hintsUsed, puzzlesSolved } = req.body || {};
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    let progress = await Progress.findOne({ teamId });
    if (!progress) {
      progress = await Progress.create({
        teamId, currentClue: 1, startedAt: null, completedClues: [], finished: false,
        finishedAt: null, escapeStatus: null, escapeQueuedAt: null, escapeStartedAt: null,
        escapeFinishedAt: null, escapeHintsUsed: 0, escapePuzzlesSolved: [],
      });
    }

    const now = new Date();

    if (status !== undefined) {
      const next = String(status).toLowerCase().trim();
      const allowed = ["waiting", "active", "finished", "queued", "escape_active", "escape_completed"];
      if (!allowed.includes(next))
        return res.status(400).json({ error: "Invalid status value" });

      const canonical =
        next === "active"   ? "escape_active"    :
        next === "finished" ? "escape_completed" :
        next === "waiting"  ? "queued"            :
        next;

      team.status               = canonical;
      team.escape_room_started  = ["escape_active", "escape_completed"].includes(canonical);
      team.escape_room_completed = canonical === "escape_completed";

      if (canonical === "escape_active") {
        team.game_state = "ESCAPE_ACTIVE";
        if (!team.escape_start_time) team.escape_start_time = now;
        progress.escapeStatus    = "active";
        if (!progress.escapeStartedAt) progress.escapeStartedAt = now;
      } else if (canonical === "escape_completed") {
        team.game_state            = "COMPLETED";
        team.is_active             = false;
        team.escape_end_time       = now;
        team.final_submission_time = now;
        progress.escapeStatus      = "finished";
        progress.escapeFinishedAt  = now;
      } else {
        // queued / waiting
        team.escape_room_started  = false;
        team.escape_room_completed = false;
        team.escape_start_time    = null;
        progress.escapeStatus     = "waiting";
        progress.escapeStartedAt  = null;
        progress.escapeFinishedAt = null;
        if (!progress.escapeQueuedAt) progress.escapeQueuedAt = now;
      }
    }

    if (hintsUsed !== undefined) {
      const n = Number(hintsUsed);
      if (Number.isFinite(n)) progress.escapeHintsUsed = Math.max(0, Math.floor(n));
    }

    if (puzzlesSolved !== undefined) {
      if (!Array.isArray(puzzlesSolved))
        return res.status(400).json({ error: "puzzlesSolved must be an array" });
      progress.escapePuzzlesSolved = Array.from(
        new Set(puzzlesSolved.map(v => Math.floor(Number(v))).filter(Number.isFinite))
      ).sort((a, b) => a - b);
    }

    await Promise.all([team.save(), progress.save()]);
    res.json({ ok: true, is_timer_active: timerActiveForState(team.game_state), user: toUiTeam(team) });
  } catch (err) {
    console.error("[escape-queue legacy]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
