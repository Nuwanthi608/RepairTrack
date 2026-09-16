const router = require("express").Router();
const jobController = require("../controllers/jobController");

router.post("/", jobController.createJob);
router.get("/", jobController.getJobs);
router.get("/:id", jobController.getJobById);
router.patch("/:id/status", jobController.updateStatus);

module.exports = router;