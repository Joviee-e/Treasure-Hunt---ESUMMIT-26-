"use strict";
/**
 * Game routes: start, status, clues, validate
 */
const express     = require("express");
const router      = express.Router();

const Team        = require("../models/Team");
const EscapeQueue = require("../models/EscapeQueue");
const { Assignment, Progress } = require("../models/Legacy");
const { toUiTeam, toClueJson } = require("../utils/serialize");
const { checkAndFailIfExpired } = require("../utils/timer");

// ─────────────────────────────────────────────────────────────────────────────
// Shared guard: load team, enforce expiry, block FAILED
// ─────────────────────────────────────────────────────────────────────────────
async function guardTeam(teamId, res) {
  if (!teamId) {
    res.status(400).json({ error: "teamId required" });
    return null;
  }
  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return null;
  }
  if (team.role === "operator") {
    res.status(400).json({ error: "Operators have no game state" });
    return null;
  }
  const nowFailed = await checkAndFailIfExpired(team);
  if (nowFailed || team.game_state === "FAILED") {
    res.status(403).json({ error: "GAME OVER", reason: team.failure_reason || "TIME_EXPIRED" });
    return null;
  }
  return team;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/start-game  — team presses "Start"
// ─────────────────────────────────────────────────────────────────────────────
router.post("/start-game", async (req, res) => {
  try {
    const { teamId } = req.body || {};
    const team = await guardTeam(teamId, res);
    if (!team) return;

    // Idempotent if already running
    if (team.game_state !== "NOT_STARTED") {
      return res.json({ ok: true, game_state: team.game_state, user: toUiTeam(team) });
    }

    // Pull clues from legacy Assignment (admin UI writes there)
    const assignment = await Assignment.findOne({ teamId: team._id }).populate("clues");
    const clues = (assignment?.clues || []).filter(c => c.title !== "__VAULT__");
    if (!clues.length)
      return res.status(400).json({ error: "No clues assigned to this team. Ask the operator." });

    const now = new Date();
    // Atomic update — cannot be race-conditioned by double-tap
    const updated = await Team.findOneAndUpdate(
      { _id: team._id, game_state: "NOT_STARTED" },   // condition: only if still NOT_STARTED
      {
        $set: {
          game_state          : "TREASURE_HUNT",
          treasure_start_time : now,
          treasure_end_time   : null,
          assigned_clues      : clues.map(c => c._id),
          total_clues         : clues.length,
          current_clue_index  : 0,
          completed_clues     : [],
          treasure_hunt_completed: false,
          status              : "queued",
        },
      },
      { new: true }
    );

    if (!updated) {
      // Race: another request already started the game — just return current state
      const fresh = await Team.findById(team._id);
      return res.json({ ok: true, game_state: fresh.game_state, user: toUiTeam(fresh) });
    }

    await Progress.findOneAndUpdate(
      { teamId: team._id },
      {
        $set: {
          currentClue: 1, startedAt: now, completedClues: [], finished: false,
          finishedAt: null, escapeStatus: null, escapeQueuedAt: null,
        },
      },
      { upsert: true }
    );

    console.log(`  ↳ GAME STARTED: ${team.name} (${clues.length} clues)`);
    res.json({ ok: true, game_state: updated.game_state, user: toUiTeam(updated) });
  } catch (err) {
    console.error("[start-game]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/start — legacy alias (old frontend uses this)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/start", async (req, res) => {
  try {
    const { teamId } = req.body || {};
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (team.game_state === "NOT_STARTED") {
      const assignment = await Assignment.findOne({ teamId }).populate("clues");
      const clues = (assignment?.clues || []).filter(c => c.title !== "__VAULT__");
      if (clues.length) {
        const now = new Date();
        await Team.findOneAndUpdate(
          { _id: teamId, game_state: "NOT_STARTED" },
          {
            $set: {
              game_state: "TREASURE_HUNT", treasure_start_time: now,
              assigned_clues: clues.map(c => c._id), total_clues: clues.length,
              current_clue_index: 0, completed_clues: [], treasure_hunt_completed: false,
            },
          }
        );
        await Progress.findOneAndUpdate(
          { teamId },
          { $set: { currentClue: 1, startedAt: now, completedClues: [], finished: false } },
          { upsert: true }
        );
      }
    }

    const progress = await Progress.findOne({ teamId });
    if (progress && !progress.startedAt) {
      progress.startedAt = new Date(); await progress.save();
    }
    const fresh = await Team.findById(teamId);
    res.json({ startedAt: progress?.startedAt || fresh.treasure_start_time || new Date() });
  } catch (err) {
    console.error("[start legacy]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team-status?teamId=xxx
// Called by team dashboard on every poll to sync state + timers
// ─────────────────────────────────────────────────────────────────────────────
router.get("/team-status", async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (team.role !== "operator") await checkAndFailIfExpired(team);

    res.json({ user: toUiTeam(team) });
  } catch (err) {
    console.error("[team-status]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team-clues?teamId=xxx
// Returns ONLY the current clue — no peeking ahead
// ─────────────────────────────────────────────────────────────────────────────
router.get("/team-clues", async (req, res) => {
  try {
    const { teamId } = req.query;
    const team = await guardTeam(teamId, res);
    if (!team) return;

    if (team.game_state !== "TREASURE_HUNT")
      return res.json({ clue: null, message: "Not in treasure hunt phase." });

    const assignment = await Assignment.findOne({ teamId }).populate("clues");
    const clues = (assignment?.clues || []).filter(c => c.title !== "__VAULT__");
    if (!clues.length) return res.json({ clue: null, reason: "NO_CLUES_ASSIGNED" });

    const idx  = Math.max(0, team.current_clue_index || 0);
    const clue = clues[idx];
    if (!clue) return res.json({ clue: null, reason: "CLUE_NOT_FOUND" });

    res.json({ clue: toClueJson(clue), index: idx, total: clues.length });
  } catch (err) {
    console.error("[team-clues]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/validate-clue  — new endpoint (preferred)
// POST /api/validate       — legacy alias (same logic, kept for old frontend)
// ─────────────────────────────────────────────────────────────────────────────
async function handleValidate(req, res) {
  try {
    const { teamId, code } = req.body || {};
    if (!teamId || !code) return res.status(400).json({ error: "teamId and code required" });

    // Load team fresh + check expiry
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const nowFailed = await checkAndFailIfExpired(team);
    if (nowFailed || team.game_state === "FAILED")
      return res.status(403).json({ error: "GAME OVER", reason: team.failure_reason || "TIME_EXPIRED" });

    if (team.game_state === "COMPLETED")
      return res.json({ valid: false, reason: "ALREADY_COMPLETED" });

    // ── Ensure legacy progress doc ────────────────────────────────────────────
    let progress = await Progress.findOne({ teamId });
    if (!progress) {
      progress = await Progress.create({
        teamId, currentClue: 1, startedAt: team.treasure_start_time || new Date(),
        completedClues: [], finished: false, finishedAt: null, escapeStatus: null,
        escapeQueuedAt: null, escapeStartedAt: null, escapeFinishedAt: null,
        escapeHintsUsed: 0, escapePuzzlesSolved: [],
      });
    }
    if (!progress.startedAt) {
      progress.startedAt = team.treasure_start_time || new Date();
      await progress.save();
    }

    // ── Fetch clues ───────────────────────────────────────────────────────────
    const assignment = await Assignment.findOne({ teamId }).populate("clues");
    const clues = (assignment?.clues || []).filter(c => c.title !== "__VAULT__");
    if (!clues.length) return res.json({ valid: false, reason: "NO_CLUES_ASSIGNED" });

    // Use Team doc as primary index source; fall back to Progress for legacy sessions
    const idx = (team.game_state === "TREASURE_HUNT")
      ? Math.max(0, team.current_clue_index || 0)
      : Math.max(0, (progress.currentClue || 1) - 1);

    const clue = clues[idx];
    if (!clue) return res.json({ valid: false, reason: "CLUE_NOT_FOUND" });

    // ── Validate code ─────────────────────────────────────────────────────────
    const entered      = String(code).trim().toUpperCase();
    const expectedCode = String(clue.validationCode || "").trim().toUpperCase();
    const valid        = entered === expectedCode;

    if (!valid) return res.json({ valid: false });

    // ── Duplicate-solve guard ─────────────────────────────────────────────────
    const clueIdStr = String(clue._id);
    if (team.completed_clues && team.completed_clues.includes(clueIdStr)) {
      return res.json({
        valid: true, alreadySolved: true,
        currentClue: (team.current_clue_index || 0) + 1,
        completed  : team.completed_clues.length,
        isLast     : idx >= clues.length - 1,
      });
    }

    const isLast = idx >= clues.length - 1;
    const now    = new Date();

    // ── Atomic update on Team ─────────────────────────────────────────────────
    const teamUpdate = {
      $addToSet: { completed_clues: clueIdStr },
      $set     : { current_clue_index: isLast ? idx : idx + 1 },
    };
    if (isLast) {
      Object.assign(teamUpdate.$set, {
        game_state             : "WAITING_ESCAPE",
        treasure_end_time      : now,
        treasure_hunt_completed: true,
        status                 : "queued",
      });
    }
    const updatedTeam = await Team.findByIdAndUpdate(teamId, teamUpdate, { new: true });

    // ── Mirror to legacy Progress ─────────────────────────────────────────────
    const progressUpdate = {
      $addToSet: { completedClues: clueIdStr },
      $set     : { currentClue: isLast ? clues.length : idx + 2 },
    };
    if (isLast) {
      Object.assign(progressUpdate.$set, {
        finished: true, finishedAt: now,
        escapeStatus: "waiting", escapeQueuedAt: now,
        escapeStartedAt: null, escapeFinishedAt: null,
      });
    }
    await Progress.findOneAndUpdate({ teamId }, progressUpdate, { upsert: true });

    // ── Add to escape queue once ──────────────────────────────────────────────
    if (isLast) {
      const alreadyQueued = await EscapeQueue.findOne({ team_id: teamId });
      if (!alreadyQueued) {
        const waitCount = await EscapeQueue.countDocuments({ status: "WAITING" });
        await EscapeQueue.create({ team_id: teamId, status: "WAITING", queue_position: waitCount + 1 });
      }
      console.log(`  ↳ TREASURE COMPLETE: ${team.name} → WAITING_ESCAPE`);
    }

    res.json({
      valid      : true,
      isLast,
      currentClue: (updatedTeam.current_clue_index || 0) + 1,   // 1-based for frontend display
      completed  : (updatedTeam.completed_clues || []).length,
      finishedAt : isLast ? now : null,
    });
  } catch (err) {
    console.error("[validate]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

router.post("/validate-clue", handleValidate);
router.post("/validate",      handleValidate);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress — operator overview
// ─────────────────────────────────────────────────────────────────────────────
router.get("/progress", async (_req, res) => {
  try {
    const rows = await Progress.find().lean();
    res.json({
      progress: rows.map(p => ({
        teamId          : String(p.teamId),
        currentClue     : p.currentClue || 1,
        cluesCompleted  : (p.completedClues || []).length,
        startedAt       : p.startedAt    || null,
        finished        : p.finished     || false,
        finishedAt      : p.finishedAt   || null,
        escapeStatus    : p.escapeStatus || null,
        escapeQueuedAt  : p.escapeQueuedAt  || null,
        escapeStartedAt : p.escapeStartedAt || null,
        escapeFinishedAt: p.escapeFinishedAt || null,
        escapeHintsUsed : p.escapeHintsUsed || 0,
        escapePuzzlesSolved: p.escapePuzzlesSolved || [],
      })),
    });
  } catch (err) {
    console.error("[progress]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
