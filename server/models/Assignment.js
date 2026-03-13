const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
teamId:{type:mongoose.Schema.Types.ObjectId,ref:"Team"},
clues:[{type:mongoose.Schema.Types.ObjectId,ref:"Clue"}]
});

module.exports = mongoose.model("Assignment",AssignmentSchema);