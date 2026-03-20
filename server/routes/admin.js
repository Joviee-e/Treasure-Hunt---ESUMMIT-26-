"use strict";
/**
 * Admin / operator routes: clue CRUD, vault, assignment, leaderboard, QR
 */
const express = require("express");
const router = express.Router();

const Team = require("../models/Team");
const Clue = require("../models/Clue");
const { Assignment } = require("../models/Legacy");
const { toClueJson, toUiTeam, normalizeAnswer } = require("../utils/serialize");
const { failTeam } = require("../utils/timer");

const CLUE_POINTS = 100;
const ESCAPE_COMPLETION_BONUS = 500;

function formatTime(ms) {
  if (!ms) return "-";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

router.get("/clues", async (_req, res) => {
  try {
    const clues = await Clue.find({ title: { $ne: "__VAULT__" } }).sort({ createdAt: 1 });
    res.json({ clues: clues.map(toClueJson) });
  } catch (err) {
    console.error("[clues GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clue", async (req, res) => {
  try {
    const { title, description, validationCode, hint, difficulty, qrImage } = req.body || {};
    if (!title || !description || !validationCode)
      return res.status(400).json({ error: "title, description, validationCode required" });

    const normalizedCode = normalizeAnswer(validationCode);
    const clue = await Clue.create({
      title,
      description,
      validationCode: normalizedCode,
      hint: hint || "",
      difficulty: difficulty || "",
      qrPayload: normalizedCode,
      qrImage: qrImage || "",
    });

    console.log(`  -> Clue CREATED: "${title}"`);
    res.json({ clue: toClueJson(clue) });
  } catch (err) {
    console.error("[clue POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/clue/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.validationCode !== undefined) {
      updates.validationCode = normalizeAnswer(updates.validationCode);
      updates.qrPayload = updates.validationCode;
    }

    const clue = await Clue.findByIdAndUpdate(id, updates, { new: true });
    if (!clue) return res.status(404).json({ error: "Clue not found" });

    if (updates.validationCode === undefined && clue.qrPayload !== normalizeAnswer(clue.validationCode)) {
      clue.qrPayload = normalizeAnswer(clue.validationCode);
      await clue.save();
    }

    res.json({ clue: toClueJson(clue) });
  } catch (err) {
    console.error("[clue PUT]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

    const upper = normalizeAnswer(code);
    const v = await Clue.findOneAndUpdate(
      { title: "__VAULT__" },
      { $set: { validationCode: upper } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`  -> VAULT CODE UPDATED: ${upper}`);
    res.json({ code: v.validationCode });
  } catch (err) {
    console.error("[vault-code PUT]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/assignment/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    let assignment = await Assignment.findOne({ teamId }).populate("clues");
    if (!assignment) {
      assignment = await Assignment.create({ teamId, clues: [] });
      await assignment.populate("clues");
    }

    const clues = (assignment.clues || [])
      .filter((c) => c.title !== "__VAULT__")
      .map(toClueJson);

    res.json({ teamId, clues });
  } catch (err) {
    console.error("[assignment GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assign", async (req, res) => {
  try {
    const { teamId, clueId } = req.body || {};
    if (!teamId || !clueId)
      return res.status(400).json({ error: "teamId and clueId required" });

    const clue = await Clue.findById(clueId);
    if (!clue) return res.status(404).json({ error: "Clue not found" });

    await Promise.all([
      Assignment.findOneAndUpdate({ teamId }, { $addToSet: { clues: clueId } }, { upsert: true }),
      Team.findByIdAndUpdate(teamId, { $addToSet: { assigned_clues: clueId } }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("[assign POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.post("/reorder-clues", async (req, res) => {
  try {
    const { teamId, orderedClueIds } = req.body || {};
    if (!teamId || !Array.isArray(orderedClueIds))
      return res.status(400).json({ error: "teamId and orderedClueIds[] required" });

    const assignment = await Assignment.findOne({ teamId });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const currentIds = (assignment.clues || []).map((id) => String(id));
    const nextIds = orderedClueIds.map((id) => String(id));
    const uniqueNext = new Set(nextIds);

    if (
      nextIds.length !== currentIds.length ||
      uniqueNext.size !== nextIds.length ||
      currentIds.some((id) => !uniqueNext.has(id))
    ) {
      return res.status(400).json({ error: "orderedClueIds must contain the same assigned clues exactly once" });
    }

    assignment.clues = nextIds;
    await assignment.save();
    await Team.findByIdAndUpdate(teamId, { $set: { assigned_clues: nextIds } });

    res.json({ ok: true });
  } catch (err) {
    console.error("[reorder-clues POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Monitor payload for admin panel.
router.get("/admin/monitor", async (_req, res) => {
  try {
    const teams = await Team.find({ role: { $ne: "operator" } }).sort({ createdAt: 1 });
    res.json({ teams: teams.map((t) => toUiTeam(t)) });
  } catch (err) {
    console.error("[admin-monitor]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard", async (_req, res) => {
  try {
    // Always fetch fresh data and disable any client/proxy caching.
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const teams = await Team.find({ role: { $ne: "operator" } });
    const allClues = await Clue.find({ title: { $ne: "__VAULT__" } })
      .sort({ order_index: 1, createdAt: 1 })
      .select({ _id: 1 });
    const fallbackAssigned = allClues.map((c) => c._id);

    const entries = [];
    for (const team of teams) {
      let dirty = false;

      if (!Array.isArray(team.assigned_clues)) {
        team.assigned_clues = [];
        dirty = true;
      }
      if (!Array.isArray(team.completed_clues)) {
        team.completed_clues = [];
        dirty = true;
      }
      if (team.assigned_clues.length === 0 && fallbackAssigned.length > 0) {
        team.assigned_clues = fallbackAssigned;
        dirty = true;
      }
      if (team.game_state === "COMPLETED") {
        const now = new Date();
        if (!team.treasure_start_time && team.treasure_end_time) {
          team.treasure_start_time = team.treasure_end_time;
          dirty = true;
        }
        if (!team.escape_start_time && team.escape_end_time) {
          team.escape_start_time = team.escape_end_time;
          dirty = true;
        }
        if (!team.treasure_end_time) {
          team.treasure_end_time = now;
          if (!team.treasure_start_time) team.treasure_start_time = now;
          dirty = true;
        }
        if (!team.escape_end_time) {
          team.escape_end_time = now;
          if (!team.escape_start_time) team.escape_start_time = now;
          dirty = true;
        }
      }

      const totalClues = team.assigned_clues.length || 0;
      const cluesCompleted = team.completed_clues.length || 0;
      if (team.total_clues !== totalClues) {
        team.total_clues = totalClues;
        dirty = true;
      }
      if (dirty) await team.save();

      const huntMs =
        team.treasure_start_time && team.treasure_end_time
          ? Math.max(0, new Date(team.treasure_end_time).getTime() - new Date(team.treasure_start_time).getTime())
          : null;
      const escapeMs =
        team.escape_start_time && team.escape_end_time
          ? Math.max(0, new Date(team.escape_end_time).getTime() - new Date(team.escape_start_time).getTime())
          : null;
      const totalMs = huntMs !== null && escapeMs !== null ? huntMs + escapeMs : null;

      const state = team.game_state || "NOT_STARTED";
      const escapeStatus = state === "COMPLETED" ? "ESCAPED" : state === "FAILED" ? "FAILED" : "-";

      const score =
        cluesCompleted * CLUE_POINTS +
        (state === "COMPLETED" ? ESCAPE_COMPLETION_BONUS : 0);

      entries.push({
        team_name: team.name || "-",
        clues_completed: cluesCompleted,
        total_clues: totalClues,
        hunt_time: formatTime(huntMs),
        escape_time: formatTime(escapeMs),
        total_time: formatTime(totalMs),
        state,
        escape_status: escapeStatus,
        score,

        _sortState: state,
        _sortTotalMs: totalMs,
      });
    }

    entries.sort((a, b) => {
      const rank = (s) => (s === "COMPLETED" ? 0 : s === "FAILED" ? 2 : 1);
      const ra = rank(a._sortState);
      const rb = rank(b._sortState);
      if (ra !== rb) return ra - rb;

      if (a._sortState === "COMPLETED") {
        return (a._sortTotalMs ?? Number.MAX_SAFE_INTEGER) - (b._sortTotalMs ?? Number.MAX_SAFE_INTEGER);
      }

      if (a.score !== b.score) return b.score - a.score;
      return b.clues_completed - a.clues_completed;
    });

    res.json(entries.map(({ _sortState, _sortTotalMs, ...row }) => row));
  } catch (err) {
    console.error("[leaderboard]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/generate-qr", async (req, res) => {
  try {
    const { clueId } = req.query;
    if (!clueId) return res.status(400).json({ error: "clueId required" });

    const clue = await Clue.findById(clueId);
    if (!clue) return res.status(404).json({ error: "Clue not found" });

    // Keep persisted payload clean and consistent with validation code.
    const normalizedCode = normalizeAnswer(clue.validationCode);
    if (clue.qrPayload !== normalizedCode) {
      clue.qrPayload = normalizedCode;
      await clue.save();
    }

    res.json({ clue: toClueJson(clue) });
  } catch (err) {
    console.error("[generate-qr]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/download-all-qr", async (_req, res) => {
  try {
    const clues = await Clue.find({ title: { $ne: "__VAULT__" } }).sort({ createdAt: 1 });
    const normalizedClues = [];

    for (const clue of clues) {
      const normalizedCode = normalizeAnswer(clue.validationCode);
      if (clue.qrPayload !== normalizedCode) {
        clue.qrPayload = normalizedCode;
        await clue.save();
      }
      normalizedClues.push(clue);
    }

    res.json({ clues: normalizedClues.map(toClueJson) });
  } catch (err) {
    console.error("[download-all-qr]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
          game_state: "COMPLETED",
          is_active: false,
          escape_end_time: now,
          final_submission_time: now,
          escape_room_completed: true,
          escape_room_started: true,
          status: "escape_completed",
        },
      });
    } else {
      await failTeam(team, "OPERATOR_ENDED");
    }

    const fresh = await Team.findById(teamId);
    console.log(`  -> OPERATOR FORCE END: ${team.name} -> ${outcome || "FAILED"}`);
    res.json({ ok: true, user: toUiTeam(fresh) });
  } catch (err) {
    console.error("[operator-end-team]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
