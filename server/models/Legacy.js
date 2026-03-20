"use strict";
/**
 * Legacy Assignment + Progress models.
 * Kept 100% intact so the existing operator/admin UI continues to work.
 * New game logic syncs into these docs so old APIs always return correct data.
 */
const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  clues : [{ type: mongoose.Schema.Types.ObjectId, ref: "Clue" }],
});
AssignmentSchema.index({ teamId: 1 }, { unique: true });

const ProgressSchema = new mongoose.Schema({
  teamId              : { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  currentClue         : { type: Number, default: 1 },
  startedAt           : Date,
  completedClues      : [String],
  finished            : { type: Boolean, default: false },
  finishedAt          : Date,
  escapeStatus        : { type: String, default: null },   // waiting | active | finished | failed
  escapeQueuedAt      : Date,
  escapeStartedAt     : Date,
  escapeFinishedAt    : Date,
  escapeHintsUsed     : { type: Number, default: 0 },
  escapePuzzlesSolved : { type: [Number], default: [] },
});
ProgressSchema.index({ teamId: 1 }, { unique: true });

module.exports = {
  Assignment: mongoose.model("Assignment", AssignmentSchema),
  Progress  : mongoose.model("Progress",   ProgressSchema),
};
