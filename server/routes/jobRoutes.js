const router = require("express").Router();
const jobController = require("../controllers/jobController");
const billingController = require("../controllers/billingController");

router.post("/", jobController.createJob);
router.get("/", jobController.getJobs);
router.get("/:id", jobController.getJobById);
router.patch("/:id/status", jobController.updateStatus);

router.post("/:id/parts", billingController.addPart);
router.delete("/:id/parts/:partId", billingController.deletePart);
router.patch("/:id/payment", billingController.updatePayment);

module.exports = router;