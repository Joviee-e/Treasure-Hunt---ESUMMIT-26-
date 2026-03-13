const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
teamId:{type:mongoose.Schema.Types.ObjectId,ref:"Team"},
currentClue:Number,
startedAt:Date,
completedClues:[String],
finished:Boolean
});

module.exports = mongoose.model("Progress",ProgressSchema);