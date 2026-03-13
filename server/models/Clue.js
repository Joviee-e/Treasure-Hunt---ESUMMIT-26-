const mongoose = require("mongoose");

const ClueSchema = new mongoose.Schema({
title:String,
description:String,
validationCode:String,
hint:String,
difficulty:String,
qrPayload:String,
createdAt:{type:Date,default:Date.now}
});

module.exports = mongoose.model("Clue",ClueSchema);