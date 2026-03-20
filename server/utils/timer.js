"use strict";

const { TREASURE_DURATION_MS, ESCAPE_DURATION_MS } = require("./config");

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
 * If so, mutates + saves the team document to FAILED.
 * Returns true if the team is now FAILED (was expired or already failed).
 */
async function checkAndFailIfExpired(team) {
  if (team.game_state === "FAILED" || team.game_state === "COMPLETED") {
    return team.game_state === "FAILED";
  }

  let expired = false;
  if (team.game_state === "TREASURE_HUNT" && treasureRemaining(team) <= 0) expired = true;
  if (team.game_state === "ESCAPE_ACTIVE"  && escapeRemaining(team)   <= 0) expired = true;

  if (expired) {
    team.game_state     = "FAILED";
    team.is_active      = false;
    team.failure_reason = "TIME_EXPIRED";
    team.status         = "queued";     // legacy field
    await team.save();
    console.log(`  ↳ TIMER EXPIRED: ${team.name}`);
    return true;
  }
  return false;
}

/**
 * Mark a team FAILED with a given reason.
 * Mutates + saves the team document.
 */
async function failTeam(team, reason) {
  team.game_state     = "FAILED";
  team.is_active      = false;
  team.failure_reason = reason || "OPERATOR_ENDED";
  team.status         = "queued";  // legacy
  await team.save();
  console.log(`  ↳ TEAM FAILED: ${team.name} – ${team.failure_reason}`);
}

module.exports = {
  TREASURE_DURATION_MS,
  ESCAPE_DURATION_MS,
  treasureRemaining,
  escapeRemaining,
  checkAndFailIfExpired,
  failTeam,
};
