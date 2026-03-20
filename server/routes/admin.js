"use strict";
/**
 * Admin / operator routes: clue CRUD, vault, assignment, leaderboard, QR
 */
const express = require("express");
const router  = express.Router();

const Team    = require("../models/Team");
const Clue    = require("../models/Clue");
const { Assignment } = require("../models/Legacy");
const { toClueJson, toUiTeam } = require("../utils/serialize");
const { failTeam }             = require("../utils/timer");

// qrPayload helper — must match what frontend expects
const cluePayload = (clue) =>
  `${String(clue._id)}|${String(clue.validationCode || "").toUpperCase()}`;

// ─────────────────────────────────────────────────────────────────────────────
// CLUE CRUD
// ─────────────────────────────────────────────────────────────────────────────

router.get("/clues", async (_req, res) => {
  try {
    const clues = await Clue.find({ title: { $ne: "__VAULT__" } }).sort({ createdAt: 1 });
    res.json({ clues: clues.map(toClueJson) });
  } catch (err) {
    console.error("[clues GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/clue — create clue
router.post("/clue", async (req, res) => {
  try {
    const { title, description, validationCode, hint, difficulty, qrImage } = req.body || {};
    if (!title || !description || !validationCode)
      return res.status(400).json({ error: "title, description, validationCode required" });

    const clue = await Clue.create({
      title,
      description,
      validationCode: String(validationCode).toUpperCase().trim(),
      hint          : hint       || "",
      difficulty    : difficulty || "",
      qrPayload     : "",
      qrImage       : qrImage || "",
    });
    clue.qrPayload = cluePayload(clue);
    await clue.save();

    console.log(`  ↳ Clue CREATED: "${title}"`);
    res.json({ clue: toClueJson(clue) });
  } catch (err) {
    console.error("[clue POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/clue/:id — update clue
router.put("/clue/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.validationCode)
      updates.validationCode = String(updates.validationCode).toUpperCase().trim();

    const clue = await Clue.findByIdAndUpdate(id, updates, { new: true });
    if (!clue) return res.status(404).json({ error: "Clue not found" });
    clue.qrPayload = cluePayload(clue);
    await clue.save();
    res.json({ clue: toClueJson(clue) });
  } catch (err) {
    console.error("[clue PUT]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/clue/:id
router.delete("/clue/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Clue.findByIdAndDelete(id);
    await Assignment.updateMany({}, { $pull: { clues: id } });
    await Team.updateMany({}, { $pull: { assigned_clues: id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("[clue DELETE]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// VAULT CODE
// ─────────────────────────────────────────────────────────────────────────────

router.get("/vault-code", async (_req, res) => {
  try {
    const v = await Clue.findOne({ title: "__VAULT__" });
    if (!v) return res.status(404).json({ error: "Vault not found" });
    res.json({ code: v.validationCode });
  } catch (err) {
    console.error("[vault-code GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/vault-code", async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "code required" });
    const upper = String(code).toUpperCase().trim();
    const v = await Clue.findOneAndUpdate(
      { title: "__VAULT__" },
      { $set: { validationCode: upper } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`  ↳ VAULT CODE UPDATED: ${upper}`);
    res.json({ code: v.validationCode });
  } catch (err) {
    console.error("[vault-code PUT]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CLUE ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/assignment/:teamId
router.get("/assignment/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    let assignment = await Assignment.findOne({ teamId }).populate("clues");
    if (!assignment) {
      assignment = await Assignment.create({ teamId, clues: [] });
      await assignment.populate("clues");
    }
    const clues = (assignment.clues || []).filter(c => c.title !== "__VAULT__").map(toClueJson);
    res.json({ teamId, clues });
  } catch (err) {
    console.error("[assignment GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/assign — add a clue to a team
router.post("/assign", async (req, res) => {
  try {
    const { teamId, clueId } = req.body || {};
    if (!teamId || !clueId)
      return res.status(400).json({ error: "teamId and clueId required" });

    const clue = await Clue.findById(clueId);
    if (!clue) return res.status(404).json({ error: "Clue not found" });

    await Promise.all([
      Assignment.findOneAndUpdate(
        { teamId },
        { $addToSet: { clues: clueId } },
        { upsert: true }
      ),
      Team.findByIdAndUpdate(teamId, { $addToSet: { assigned_clues: clueId } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[assign POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/remove-clue — remove a clue from a team
router.post("/remove-clue", async (req, res) => {
  try {
    const { teamId, clueId } = req.body || {};
    if (!teamId || !clueId)
      return res.status(400).json({ error: "teamId and clueId required" });

    await Promise.all([
      Assignment.findOneAndUpdate({ teamId }, { $pull: { clues: clueId } }),
      Team.findByIdAndUpdate(teamId, { $pull: { assigned_clues: clueId } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[remove-clue POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reorder-clues — set clue order for a team
router.post("/reorder-clues", async (req, res) => {
  try {
    const { teamId, orderedClueIds } = req.body || {};
    if (!teamId || !Array.isArray(orderedClueIds))
      return res.status(400).json({ error: "teamId and orderedClueIds[] required" });

    const assignment = await Assignment.findOne({ teamId });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const currentIds = (assignment.clues || []).map(id => String(id));
    const nextIds    = orderedClueIds.map(id => String(id));
    const uniqueNext = new Set(nextIds);

    if (
      nextIds.length !== currentIds.length ||
      uniqueNext.size !== nextIds.length   ||
      currentIds.some(id => !uniqueNext.has(id))
    ) return res.status(400).json({ error: "orderedClueIds must contain the same assigned clues exactly once" });

    assignment.clues = nextIds;
    await assignment.save();
    await Team.findByIdAndUpdate(teamId, { $set: { assigned_clues: nextIds } });
    res.json({ ok: true });
  } catch (err) {
    console.error("[reorder-clues POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

router.get("/leaderboard", async (_req, res) => {
  try {
    const teams = await Team.find({ role: { $ne: "operator" } }).lean();

    const entries = teams.map(t => {
      const tMs =
        t.treasure_start_time && t.treasure_end_time
          ? new Date(t.treasure_end_time).getTime() - new Date(t.treasure_start_time).getTime()
          : null;
      const eMs =
        t.escape_start_time && t.escape_end_time
          ? new Date(t.escape_end_time).getTime() - new Date(t.escape_start_time).getTime()
          : null;
      const totalMs = tMs !== null && eMs !== null ? tMs + eMs : null;

      return {
        id                  : String(t._id),
        team_name           : t.name,
        game_state          : t.game_state || "NOT_STARTED",
        failure_reason      : t.failure_reason || null,
        completed_clues     : (t.completed_clues || []).length,
        total_clues         : t.total_clues || 0,
        treasure_time_ms    : tMs,
        escape_time_ms      : eMs,
        total_time_ms       : totalMs,
        final_submission_time: t.final_submission_time || null,
      };
    });

    entries.sort((a, b) => {
      const rank = s => s === "COMPLETED" ? 0 : s === "FAILED" ? 2 : 1;
      const ra = rank(a.game_state), rb = rank(b.game_state);
      if (ra !== rb) return ra - rb;
      if (a.game_state === "COMPLETED")
        return (a.total_time_ms ?? Infinity) - (b.total_time_ms ?? Infinity);
      if (a.game_state === "FAILED")
        return b.completed_clues - a.completed_clues;
      return 0;
    });

    res.json({ leaderboard: entries });
  } catch (err) {
    console.error("[leaderboard]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// QR helpers
// ─────────────────────────────────────────────────────────────────────────────

router.get("/generate-qr", async (req, res) => {
  try {
    const { clueId } = req.query;
    if (!clueId) return res.status(400).json({ error: "clueId required" });
    const clue = await Clue.findById(clueId);
    if (!clue) return res.status(404).json({ error: "Clue not found" });
    res.json({ clue: toClueJson(clue) });
  } catch (err) {
    console.error("[generate-qr]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/download-all-qr", async (_req, res) => {
  try {
    const clues = await Clue.find({ title: { $ne: "__VAULT__" } }).sort({ createdAt: 1 });
    res.json({ clues: clues.map(toClueJson) });
  } catch (err) {
    console.error("[download-all-qr]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OPERATOR FORCE END
// ─────────────────────────────────────────────────────────────────────────────

router.post("/operator-end-team", async (req, res) => {
  try {
    const { teamId, outcome } = req.body || {};
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (String(outcome || "").toUpperCase() === "COMPLETED") {
      const now = new Date();
      await Team.findByIdAndUpdate(teamId, {
        $set: {
          game_state            : "COMPLETED",
          is_active             : false,
          escape_end_time       : now,
          final_submission_time : now,
          escape_room_completed : true,
          escape_room_started   : true,
          status                : "escape_completed",
        },
      });
    } else {
      await failTeam(team, "OPERATOR_ENDED");
    }

    const fresh = await Team.findById(teamId);
    console.log(`  ↳ OPERATOR FORCE END: ${team.name} → ${outcome || "FAILED"}`);
    res.json({ ok: true, user: toUiTeam(fresh) });
  } catch (err) {
    console.error("[operator-end-team]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
