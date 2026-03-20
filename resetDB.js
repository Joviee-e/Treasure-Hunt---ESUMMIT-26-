// resetDB.js
const mongoose = require("mongoose");

// 🔴 PUT YOUR MONGODB URI HERE
const MONGO_URI = "mongodb+srv://jovibackups1_db_user:apnpWSpGa69PCUq2@cluster0.myin9qx.mongodb.net/?appName=Cluster0";

async function resetDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    const db = mongoose.connection.db;

    console.log("🔥 Clearing collections...");

    // Clear main game collections
    await db.collection("teams").deleteMany({});
    await db.collection("escapequeues").deleteMany({});
    await db.collection("progresses").deleteMany({});
    await db.collection("assignments").deleteMany({});

    console.log("✅ Core collections cleared");

    // ⚠️ OPTIONAL: Fix QR payloads in clues
    console.log("🔧 Fixing QR payloads...");

    const clues = await db.collection("clues").find({}).toArray();

    for (const clue of clues) {
      if (clue.validationCode) {
        const cleanCode = clue.validationCode.trim().toUpperCase();

        await db.collection("clues").updateOne(
          { _id: clue._id },
          {
            $set: {
              qrPayload: cleanCode,
            },
          }
        );
      }
    }

    console.log("✅ QR payloads fixed");

    console.log("🎉 DATABASE RESET COMPLETE");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

resetDatabase();