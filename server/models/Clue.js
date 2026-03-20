"use strict";
const mongoose = require("mongoose");

const ClueSchema = new mongoose.Schema(
  {
    title         : { type: String, required: true },
    description   : { type: String, required: true },
    validationCode: { type: String, required: true, uppercase: true, trim: true },
    hint          : { type: String, default: "" },
    difficulty    : { type: String, default: "" },
    qrPayload     : { type: String, default: "" },
    qrImage       : { type: String, default: "" },   // base64 PNG data URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clue", ClueSchema);
