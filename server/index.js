const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");
const requireAuth = require("./middleware/auth");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "RepairTrack API running", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: err.message });
  }
});

// Login නැතුව පාවිච්චි කරන්න පුළුවන්
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/public", require("./routes/publicRoutes"));

// Login වෙලා ඉන්න ඕන
app.use("/api/jobs", requireAuth, require("./routes/jobRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Port ${PORT} error:`, err.message);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});