const db = require("../config/db");

const LOCKED = ["delivered", "cancelled"];

async function getJobStatus(jobId) {
  const [rows] = await db.query("SELECT status FROM jobs WHERE id = ?", [jobId]);
  return rows.length ? rows[0].status : null;
}

// POST /api/jobs/:id/parts
exports.addPart = async (req, res) => {
  const { id } = req.params;
  const { part_name, quantity, unit_cost } = req.body;
  const qty = Number(quantity ?? 1);
  const cost = Number(unit_cost);

  if (!part_name || !String(part_name).trim()) {
    return res.status(400).json({ message: "Part name is required" });
  }
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ message: "Quantity must be a whole number (1 or more)" });
  }
  if (unit_cost === undefined || unit_cost === "" || !Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ message: "Unit cost must be 0 or more" });
  }

  try {
    const status = await getJobStatus(id);
    if (!status) return res.status(404).json({ message: "Job not found" });
    if (LOCKED.includes(status)) {
      return res.status(400).json({ message: "Cannot change parts of a delivered or cancelled job" });
    }

    const [result] = await db.query(
      "INSERT INTO job_parts (job_id, part_name, quantity, unit_cost) VALUES (?, ?, ?, ?)",
      [id, String(part_name).trim(), qty, cost]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/jobs/:id/parts/:partId
exports.deletePart = async (req, res) => {
  const { id, partId } = req.params;
  try {
    const status = await getJobStatus(id);
    if (!status) return res.status(404).json({ message: "Job not found" });
    if (LOCKED.includes(status)) {
      return res.status(400).json({ message: "Cannot change parts of a delivered or cancelled job" });
    }

    // job_id එකත් check කරනවා, එතකොට වෙන job එකක part එකක් මකන්න බැහැ
    const [result] = await db.query(
      "DELETE FROM job_parts WHERE id = ? AND job_id = ?",
      [partId, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Part not found" });
    res.json({ message: "Part removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/jobs/:id/payment
exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const labour = Number(req.body.labour_cost);
  const advance = Number(req.body.advance_paid);

  if (!Number.isFinite(labour) || labour < 0 || !Number.isFinite(advance) || advance < 0) {
    return res.status(400).json({ message: "Labour cost and advance must be 0 or more" });
  }

  try {
    const [result] = await db.query(
      "UPDATE jobs SET labour_cost = ?, advance_paid = ? WHERE id = ?",
      [labour, advance, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Payment updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};