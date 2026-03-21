"use strict";

const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const Team = require("./server/models/Team");
const Clue = require("./server/models/Clue");
const EscapeQueue = require("./server/models/EscapeQueue");
const { Assignment, Progress } = require("./server/models/Legacy");
const { SALT_ROUNDS } = require("./server/utils/config");
const { CLUE_DATABASE, CLUE_MAP } = require("./server/data/clueDatabase");

const DEFAULT_TEAM_PASSWORD = process.env.SEED_TEAM_PASSWORD || "MATRIX123";

function assertValidDataset() {
  const allCodes = new Set();
  for (const team of CLUE_DATABASE) {
    if (!team.teamId || !Array.isArray(team.clues)) throw new Error("Invalid team entry in CLUE_DATABASE");
    if (team.clues.length !== 6) throw new Error(`Team ${team.teamId} must have exactly 6 clues`);

    const nums = team.clues.map((c) => c.clueNumber).sort((a, b) => a - b);
    if (nums.join(",") !== "2,3,4,5,6,7") throw new Error(`Team ${team.teamId} has invalid clue numbers`);

    for (const clue of team.clues) {
      if (!/^KEY1_[A-Z0-9]{6,8}_[2-7]$/.test(clue.code)) {
        throw new Error(`Invalid clue code format: ${clue.code}`);
      }
      const token = clue.code.split("_")[1];
      if (allCodes.has(token)) throw new Error(`Duplicate random token detected: ${token}`);
      allCodes.add(token);

      const map = CLUE_MAP[clue.code];
      if (!map || map.teamId !== team.teamId || map.clueNumber !== clue.clueNumber) {
        throw new Error(`CLUE_MAP mismatch for code: ${clue.code}`);
      }
    }
  }
}

async function clearDatabase() {
  await Promise.all([
    Assignment.deleteMany({}),
    Progress.deleteMany({}),
    EscapeQueue.deleteMany({}),
    Clue.deleteMany({ title: { $ne: "__VAULT__" } }),
    Team.deleteMany({ role: { $ne: "operator" } }),
  ]);
}

async function seedTeamsAndClues() {
  const passwordHash = await bcrypt.hash(DEFAULT_TEAM_PASSWORD, SALT_ROUNDS);

  for (const teamData of CLUE_DATABASE) {
    const team = await Team.create({
      name: teamData.teamId,
      password: passwordHash,
      role: "team",
      game_state: "NOT_STARTED",
      current_clue_index: 0,
      completed_clues: [],
      assigned_clues: [],
      total_clues: 0,
      is_active: true,
      failure_reason: null,
      treasure_hunt_completed: false,
      escape_room_started: false,
      escape_room_completed: false,
      status: "queued",
    });

    const clueDocs = await Clue.insertMany(
      teamData.clues.map((clue) => ({
        title: `${teamData.teamId} - CLUE ${clue.clueNumber}`,
        description: clue.clueText,
        validationCode: clue.code,
        hint: "",
        difficulty: "",
        qrPayload: clue.code,
        qrImage: "",
      }))
    );

    const clueIds = clueDocs.map((c) => c._id);

    await Promise.all([
      Team.updateOne(
        { _id: team._id },
        {
          $set: {
            assigned_clues: clueIds,
            total_clues: clueIds.length,
            current_clue_index: 0,
            completed_clues: [],
          },
        }
      ),
      Assignment.create({ teamId: team._id, clues: clueIds }),
      Progress.create({
        teamId: team._id,
        currentClue: 1,
        startedAt: null,
        completedClues: [],
        finished: false,
        finishedAt: null,
        escapeStatus: null,
        escapeQueuedAt: null,
        escapeStartedAt: null,
        escapeFinishedAt: null,
        escapeHintsUsed: 0,
        escapePuzzlesSolved: [],
      }),
    ]);
  }
}

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in .env");

  assertValidDataset();

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  try {
    await clearDatabase();
    await seedTeamsAndClues();

    const teamCount = await Team.countDocuments({ role: "team" });
    const clueCount = await Clue.countDocuments({ title: { $ne: "__VAULT__" } });

    console.log(`Seed complete: teams=${teamCount}, clues=${clueCount}`);
    console.log(`Lookup map entries: ${Object.keys(CLUE_MAP).length}`);
    console.log(`Default team password: ${DEFAULT_TEAM_PASSWORD}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("seedClues failed:", err);
  process.exit(1);
});
