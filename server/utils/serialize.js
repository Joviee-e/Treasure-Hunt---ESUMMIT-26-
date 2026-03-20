"use strict";

const { treasureRemaining, escapeRemaining, TREASURE_DURATION_MS, ESCAPE_DURATION_MS } = require("./timer");

function normalizeAnswer(value) {
  return String(value || "").trim().toUpperCase();
}

/**
 * Serialize a Team doc into the shape the frontend expects.
 * ALL legacy fields are preserved so no frontend changes are needed.
 * New fields are additive; old clients simply ignore them.
 */
function toUiTeam(team) {
  const gameState = team.game_state || "NOT_STARTED";
  const assignedCluesCount = Array.isArray(team.assigned_clues)
    ? team.assigned_clues.length
    : Number(team.total_clues || 0);
  const completedCluesCount = Array.isArray(team.completed_clues)
    ? team.completed_clues.length
    : 0;
  const isTimerActive = gameState === "TREASURE_HUNT" || gameState === "ESCAPE_ACTIVE";

  return {
    id                     : String(team._id),
    team_name              : team.name,
    role                   : team.role === "operator" ? "admin" : "team",
    status                 : team.status || "queued",
    treasure_hunt_completed: !!team.treasure_hunt_completed,
    escape_room_started    : !!team.escape_room_started,
    escape_room_completed  : !!team.escape_room_completed,
    escape_start_time      : team.escape_start_time || null,

    game_state             : gameState,
    is_active              : team.is_active !== false,
    is_timer_active        : isTimerActive,
    failure_reason         : team.failure_reason || null,
    treasure_start_time    : team.treasure_start_time || null,
    treasure_end_time      : team.treasure_end_time || null,
    escape_end_time        : team.escape_end_time || null,
    final_submission_time  : team.final_submission_time || null,
    current_clue_index     : team.current_clue_index || 0,
    clues_completed        : completedCluesCount,
    total_clues            : assignedCluesCount,
    vault_code             : team.vault_code || null,

    treasure_remaining_ms  : gameState === "TREASURE_HUNT" ? treasureRemaining(team) : null,
    escape_remaining_ms    : gameState === "ESCAPE_ACTIVE" ? escapeRemaining(team) : null,
    treasure_total_ms      : TREASURE_DURATION_MS,
    escape_total_ms        : ESCAPE_DURATION_MS,
  };
}

/**
 * Serialize a Clue doc into the shape the frontend expects.
 */
function toClueJson(c) {
  const normalizedCode = normalizeAnswer(c.validationCode);
  return {
    id            : String(c._id),
    title         : c.title,
    description   : c.description,
    validationCode: normalizedCode,
    hint          : c.hint || "",
    difficulty    : c.difficulty || "",
    qrPayload     : normalizedCode,
    qrImage       : c.qrImage || "",
  };
}

module.exports = { toUiTeam, toClueJson, normalizeAnswer };
