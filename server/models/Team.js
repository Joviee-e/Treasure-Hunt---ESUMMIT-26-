const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
name:String,
password:String,
createdAt:{type:Date,default:Date.now}
});

module.exports = mongoose.model("Team",TeamSchema);