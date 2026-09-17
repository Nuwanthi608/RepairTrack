const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const INVALID = "Invalid email or password";

// POST /api/auth/login
exports.login = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0];
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) return res.status(401).json({ message: INVALID });

    const payload = { id: user.id, name: user.name, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });

    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ user: req.user });
};