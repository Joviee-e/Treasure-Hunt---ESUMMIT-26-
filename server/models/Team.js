"use strict";
const mongoose = require("mongoose");

const GAME_STATES = ["NOT_STARTED", "TREASURE_HUNT", "WAITING_ESCAPE", "ESCAPE_ACTIVE", "COMPLETED", "FAILED"];

const TeamSchema = new mongoose.Schema(
  {
    name    : { type: String, required: true, unique: true, uppercase: true, trim: true },
    password: { type: String, required: true },
    role    : { type: String, enum: ["team", "operator"], default: "team" },

    // ── Canonical game state (single source of truth) ─────────────────────────
    game_state: { type: String, enum: GAME_STATES, default: "NOT_STARTED" },

    // ── Server-set timers ONLY — never accept from client ────────────────────
    treasure_start_time  : { type: Date, default: null },
    treasure_end_time    : { type: Date, default: null },
    escape_start_time    : { type: Date, default: null },
    escape_end_time      : { type: Date, default: null },
    final_submission_time: { type: Date, default: null },

    // ── Clue tracking ─────────────────────────────────────────────────────────
    current_clue_index: { type: Number, default: 0 },       // 0-based
    assigned_clues    : [{ type: mongoose.Schema.Types.ObjectId, ref: "Clue" }],
    completed_clues   : [{ type: String }],                  // clue _id strings
    total_clues       : { type: Number, default: 0 },

    // ── Vault ─────────────────────────────────────────────────────────────────
    vault_code: { type: String, default: null },             // per-team override

    // ── Failure info ──────────────────────────────────────────────────────────
    failure_reason: { type: String, default: null },         // TIME_EXPIRED | OPERATOR_ENDED
    is_active      : { type: Boolean, default: true },

    // ── Legacy fields — kept so old operator UI never breaks ──────────────────
    status: {
      type   : String,
      enum   : ["queued", "escape_active", "escape_completed"],
      default: "queued",
    },
    treasure_hunt_completed: { type: Boolean, default: false },
    escape_room_started    : { type: Boolean, default: false },
    escape_room_completed  : { type: Boolean, default: false },
  },
  { timestamps: true }
);

TeamSchema.index({ game_state: 1 });
TeamSchema.index({ is_active : 1 });
TeamSchema.statics.GAME_STATES = GAME_STATES;

module.exports = mongoose.model("Team", TeamSchema);
