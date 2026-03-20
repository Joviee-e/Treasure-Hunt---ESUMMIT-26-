"use strict";
const mongoose = require("mongoose");

const EscapeQueueSchema = new mongoose.Schema(
  {
    team_id: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "Team",
      required: true,
      unique  : true,     // one entry per team
    },
    status        : { type: String, enum: ["WAITING", "ACTIVE", "DONE", "FAILED"], default: "WAITING" },
    queue_position: { type: Number, default: 0 },
    started_at    : { type: Date, default: null },
    ended_at      : { type: Date, default: null },
  },
  { timestamps: true }
);

EscapeQueueSchema.index({ status: 1, queue_position: 1 });

module.exports = mongoose.model("EscapeQueue", EscapeQueueSchema);
