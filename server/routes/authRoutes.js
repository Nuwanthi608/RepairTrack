const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const requireAuth = require("../middleware/auth");
const { login, me } = require("../controllers/authController");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // විනාඩි 15
  limit: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

router.post("/login", loginLimiter, login);
router.get("/me", requireAuth, me);

module.exports = router;