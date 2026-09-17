const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { trackJob } = require("../controllers/publicController");

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // විනාඩි 15
  limit: 30,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

router.post("/track", trackLimiter, trackJob);

module.exports = router;