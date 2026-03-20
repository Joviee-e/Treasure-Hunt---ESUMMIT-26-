"use strict";

const { TREASURE_DURATION_MS, ESCAPE_DURATION_MS } = require("./config");
const EscapeQueue = require("../models/EscapeQueue");

/** Milliseconds remaining in the treasure hunt phase. */
function treasureRemaining(team) {
  if (!team.treasure_start_time) return TREASURE_DURATION_MS;
  const elapsed = Date.now() - new Date(team.treasure_start_time).getTime();
  return Math.max(0, TREASURE_DURATION_MS - elapsed);
}

/** Milliseconds remaining in the escape room phase. */
function escapeRemaining(team) {
  if (!team.escape_start_time) return ESCAPE_DURATION_MS;
  const elapsed = Date.now() - new Date(team.escape_start_time).getTime();
  return Math.max(0, ESCAPE_DURATION_MS - elapsed);
}

/**
 * Check whether the team's active timer has expired.
 * Returns true if the team is FAILED.
 */
async function checkAndFailIfExpired(team) {
  if (team.game_state === "FAILED" || team.game_state === "COMPLETED") {
    return team.game_state === "FAILED";
  }

  let expired = false;
  let escapeExpired = false;

  if (team.game_state === "TREASURE_HUNT" && treasureRemaining(team) <= 0) {
    expired = true;
  }

  if (team.game_state === "ESCAPE_ACTIVE" && escapeRemaining(team) <= 0) {
    expired = true;
    escapeExpired = true;
  }

  if (!expired) return false;

  const now = new Date();
  team.game_state = "FAILED";
  team.is_active = false;
  team.failure_reason = escapeExpired ? "TIME_EXPIRED" : "TREASURE_TIMEOUT";
  team.status = "queued";
  if (escapeExpired) team.escape_end_time = now;
  if (!escapeExpired) team.treasure_end_time = now;

  await team.save();
  await EscapeQueue.deleteOne({ team_id: team._id });
  console.log(`  -> TIMER EXPIRED: ${team.name}`);
  return true;
}

/**
 * Mark a team FAILED with a given reason.
 */
async function failTeam(team, reason) {
  if (team.game_state === "COMPLETED" || team.game_state === "FAILED") return team;

  const now = new Date();
  team.game_state = "FAILED";
  team.is_active = false;
  team.failure_reason = reason || "OPERATOR_ENDED";
  team.status = "queued";
  if (team.escape_start_time && !team.escape_end_time) team.escape_end_time = now;

  await team.save();
  await EscapeQueue.deleteOne({ team_id: team._id });
  console.log(`  -> TEAM FAILED: ${team.name} - ${team.failure_reason}`);
  return team;
}

module.exports = {
  TREASURE_DURATION_MS,
  ESCAPE_DURATION_MS,
  treasureRemaining,
  escapeRemaining,
  checkAndFailIfExpired,
  failTeam,
};
