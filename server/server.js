const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Team = require("./models/Team");
const Clue = require("./models/Clue");
const Assignment = require("./models/Assignment");
const Progress = require("./models/Progress");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(()=> console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const toUiTeam = (team)=>({
  id: String(team._id),
  team_name: team.name,
  role: "team",
});

const cluePayload = (clue)=>`${String(clue._id)}|${String(clue.validationCode || "").toUpperCase()}`;

app.get("/api/teams", async (_req,res)=>{
  try{
    const teams = await Team.find().sort({createdAt:1});
    res.json({teams: teams.map(toUiTeam)});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post("/api/team", async (req,res)=>{
  try{
    const { teamName, password } = req.body || {};
    if(!teamName || !password)return res.status(400).json({error:"teamName and password required"});
    const existing = await Team.findOne({name:teamName.toUpperCase()});
    if(existing)return res.status(409).json({error:"Team already exists"});
    const team = await Team.create({name:teamName.toUpperCase(), password});
    await Assignment.create({teamId:team._id, clues:[]});
    await Progress.create({teamId:team._id, currentClue:1, startedAt:null, completedClues:[], finished:false});
    res.json({team:toUiTeam(team)});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post("/api/login", async (req,res)=>{
  try{
    const { teamName, password } = req.body || {};
    if(String(teamName||"").toUpperCase()==="OPERATOR" && password==="zion2077"){
      return res.json({user:{id:"admin1",team_name:"OPERATOR",role:"admin"}});
    }
    const team = await Team.findOne({name:String(teamName||"").toUpperCase(), password});
    if(!team)return res.status(401).json({error:"Invalid credentials"});
    let progress = await Progress.findOne({teamId:team._id});
    if(!progress)progress = await Progress.create({teamId:team._id,currentClue:1,startedAt:null,completedClues:[],finished:false});
    let assignment = await Assignment.findOne({teamId:team._id});
    if(!assignment)await Assignment.create({teamId:team._id,clues:[]});
    res.json({user:toUiTeam(team)});
  }catch(err){res.status(500).json({error:err.message});}
});

app.get("/api/clues", async (_req,res)=>{
  try{
    const clues = await Clue.find().sort({createdAt:1});
    res.json({clues: clues.map(c=>({
      id:String(c._id),
      title:c.title,
      description:c.description,
      validationCode:c.validationCode,
      hint:c.hint,
      difficulty:c.difficulty,
      qrPayload:c.qrPayload || cluePayload(c),
    }))});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post("/api/clue", async (req,res)=>{
  try{
    const {title,description,validationCode,hint,difficulty} = req.body || {};
    if(!title || !description || !validationCode)return res.status(400).json({error:"title, description, validationCode required"});
    const clue = await Clue.create({
      title, description, validationCode:String(validationCode).toUpperCase(),
      hint:hint || "", difficulty:difficulty || "", qrPayload:""
    });
    clue.qrPayload = cluePayload(clue);
    await clue.save();
    res.json({clue:{
      id:String(clue._id), title:clue.title, description:clue.description, validationCode:clue.validationCode,
      hint:clue.hint, difficulty:clue.difficulty, qrPayload:clue.qrPayload
    }});
  }catch(err){res.status(500).json({error:err.message});}
});

app.put("/api/clue/:id", async (req,res)=>{
  try{
    const {id} = req.params;
    const updates = {...req.body};
    if(updates.validationCode)updates.validationCode = String(updates.validationCode).toUpperCase();
    const clue = await Clue.findByIdAndUpdate(id, updates, {new:true});
    if(!clue)return res.status(404).json({error:"Clue not found"});
    clue.qrPayload = cluePayload(clue);
    await clue.save();
    res.json({clue:{
      id:String(clue._id), title:clue.title, description:clue.description, validationCode:clue.validationCode,
      hint:clue.hint, difficulty:clue.difficulty, qrPayload:clue.qrPayload
    }});
  }catch(err){res.status(500).json({error:err.message});}
});

app.delete("/api/clue/:id", async (req,res)=>{
  try{
    const {id} = req.params;
    await Clue.findByIdAndDelete(id);
    await Assignment.updateMany({}, {$pull:{clues:id}});
    res.json({ok:true});
  }catch(err){res.status(500).json({error:err.message});}
});

app.get("/api/assignment/:teamId", async (req,res)=>{
  try{
    const {teamId} = req.params;
    let assignment = await Assignment.findOne({teamId}).populate("clues");
    if(!assignment)assignment = await Assignment.create({teamId, clues:[]});
    const clues = (assignment.clues || []).map(c=>({
      id:String(c._id), title:c.title, description:c.description, validationCode:c.validationCode, hint:c.hint, difficulty:c.difficulty, qrPayload:c.qrPayload || cluePayload(c)
    }));
    res.json({teamId, clues});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post("/api/assign", async (req,res)=>{
  try{
    const {teamId, clueId} = req.body || {};
    if(!teamId || !clueId)return res.status(400).json({error:"teamId and clueId required"});
    const clue = await Clue.findById(clueId);
    if(!clue)return res.status(404).json({error:"Clue not found"});
    let assignment = await Assignment.findOne({teamId});
    if(!assignment)assignment = await Assignment.create({teamId, clues:[]});
    if(!assignment.clues.find(id=>String(id)===String(clueId))){
      assignment.clues.push(clueId);
      await assignment.save();
    }
    res.json({ok:true});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post("/api/remove-clue", async (req,res)=>{
  try{
    const {teamId, clueId} = req.body || {};
    if(!teamId || !clueId)return res.status(400).json({error:"teamId and clueId required"});
    let assignment = await Assignment.findOne({teamId});
    if(!assignment)assignment = await Assignment.create({teamId, clues:[]});
    assignment.clues = assignment.clues.filter(id=>String(id)!==String(clueId));
    await assignment.save();
    const progress = await Progress.findOne({teamId});
    if(progress){
      const max = assignment.clues.length;
      progress.currentClue = max===0 ? 1 : Math.min(Math.max(1, progress.currentClue || 1), max);
      progress.completedClues = (progress.completedClues || []).slice(0, Math.max(0, max));
      await progress.save();
    }
    res.json({ok:true});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post("/api/validate", async (req,res)=>{
  try{
    const {teamId, code} = req.body || {};
    if(!teamId || !code)return res.status(400).json({error:"teamId and code required"});
    let assignment = await Assignment.findOne({teamId}).populate("clues");
    if(!assignment)assignment = await Assignment.create({teamId, clues:[]});
    let progress = await Progress.findOne({teamId});
    if(!progress)progress = await Progress.create({teamId,currentClue:1,startedAt:new Date(),completedClues:[],finished:false});
    if(!progress.startedAt)progress.startedAt = new Date();

    const clues = assignment.clues || [];
    if(!clues.length)return res.json({valid:false, reason:"NO_CLUES_ASSIGNED"});
    const idx = Math.max(0, (progress.currentClue || 1)-1);
    const clue = clues[idx];
    if(!clue)return res.json({valid:false, reason:"CLUE_NOT_FOUND"});

    const entered = String(code).trim().toUpperCase();
    const expectedCode = String(clue.validationCode || "").toUpperCase();
    const expectedPayload = cluePayload(clue).toUpperCase();
    const valid = entered === expectedCode || entered === expectedPayload;
    if(!valid)return res.json({valid:false});

    if(!progress.completedClues.includes(String(clue._id))){
      progress.completedClues.push(String(clue._id));
    }
    const isLast = idx >= clues.length - 1;
    if(!isLast)progress.currentClue = idx + 2;
    if(isLast)progress.finished = true;
    await progress.save();

    res.json({
      valid:true,
      isLast,
      currentClue:progress.currentClue,
      completed:progress.completedClues.length
    });
  }catch(err){res.status(500).json({error:err.message});}
});

app.get("/api/progress", async (_req,res)=>{
  try{
    const rows = await Progress.find().lean();
    res.json({progress:rows.map(p=>({
      teamId:String(p.teamId),
      currentClue:p.currentClue || 1,
      cluesCompleted:(p.completedClues || []).length,
      startedAt:p.startedAt || null,
      finished:p.finished || false
    }))});
  }catch(err){res.status(500).json({error:err.message});}
});

app.listen(process.env.PORT, ()=>{
    console.log("Server running on port " + process.env.PORT);
});
