"use strict";

module.exports = {
  // ── Timer durations (milliseconds) ───────────────────────────────────────────
  // Change these to adjust game times without touching any other file
  TREASURE_DURATION_MS : 55 * 60 * 1000,   // 55 minutes
  ESCAPE_DURATION_MS   : 5 * 60 * 1000,    // 5 minutes

  // ── Security ──────────────────────────────────────────────────────────────────
  SALT_ROUNDS : 10,

  // ── Default seeded credentials ────────────────────────────────────────────────
  OPERATOR_NAME     : "OPERATOR",
  OPERATOR_PASSWORD : "zion2077",
  DEFAULT_VAULT_CODE: "ZION-2077",
};
