const crypto = require("crypto");
const db = require("../config/db");

const STATUSES = [
  "received", "diagnosing", "waiting_for_parts",
  "repairing", "ready", "delivered", "cancelled",
];
const DEVICE_TYPES = ["phone", "laptop", "tablet", "other"];

// RT-7K3P9Q වගේ අහඹු job number එකක් (0/O, 1/I වගේ පටලැවෙන අකුරු නැතුව)
function generateJobNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[crypto.randomInt(chars.length)];
  return `RT-${code}`;
}

const round2 = (n) => Math.round(n * 100) / 100;

// POST /api/jobs
exports.createJob = async (req, res) => {
  const {
    customer_name, phone, device_type, brand, model, serial_imei,
    fault_description, accessories, labour_cost, advance_paid, expected_date,
  } = req.body;

  if (!customer_name || !phone || !device_type || !fault_description) {
    return res.status(400).json({
      message: "customer_name, phone, device_type and fault_description are required",
    });
  }
  if (!/^07\d{8}$/.test(phone)) {
    return res.status(400).json({ message: "Phone must be like 0771234567" });
  }
  if (!DEVICE_TYPES.includes(device_type)) {
    return res.status(400).json({ message: "Invalid device_type" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Customer දැනටමත් ඉන්නවද phone number එකෙන් බලනවා
    const [existing] = await conn.query(
      "SELECT id FROM customers WHERE phone = ?", [phone]
    );
    let customerId;
    if (existing.length) {
      customerId = existing[0].id;
    } else {
      const [r] = await conn.query(
        "INSERT INTO customers (name, phone) VALUES (?, ?)", [customer_name, phone]
      );
      customerId = r.insertId;
    }

    // Unique job number එකක් හම්බවෙනකම් generate කරනවා
    let jobNumber;
    let taken = true;
    while (taken) {
      jobNumber = generateJobNumber();
      const [rows] = await conn.query(
        "SELECT 1 FROM jobs WHERE job_number = ?", [jobNumber]
      );
      taken = rows.length > 0;
    }

    const [result] = await conn.query(
      `INSERT INTO jobs
        (job_number, customer_id, device_type, brand, model, serial_imei,
         fault_description, accessories, labour_cost, advance_paid, expected_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobNumber, customerId, device_type, brand || null, model || null,
        serial_imei || null, fault_description, accessories || null,
        labour_cost || 0, advance_paid || 0, expected_date || null,
      ]
    );

    await conn.query(
      "INSERT INTO status_history (job_id, status, note) VALUES (?, 'received', ?)",
      [result.insertId, "Device received"]
    );

    await conn.commit();
    res.status(201).json({ id: result.insertId, job_number: jobNumber });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

// GET /api/jobs  (?status=ready)
exports.getJobs = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT j.id, j.job_number, j.device_type, j.brand, j.model,
             j.status, j.expected_date, j.created_at,
             c.name AS customer_name, c.phone
      FROM jobs j
      JOIN customers c ON c.id = j.customer_id`;
    const params = [];

    if (status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      sql += " WHERE j.status = ?";
      params.push(status);
    }
    sql += " ORDER BY j.created_at DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/jobs/:id
exports.getJobById = async (req, res) => {
  const { id } = req.params;
  try {
    const [jobs] = await db.query(
      `SELECT j.*, c.name AS customer_name, c.phone
       FROM jobs j
       JOIN customers c ON c.id = j.customer_id
       WHERE j.id = ?`,
      [id]
    );
    if (!jobs.length) return res.status(404).json({ message: "Job not found" });

    const [parts] = await db.query(
      `SELECT id, part_name, quantity, unit_cost,
              quantity * unit_cost AS line_total
       FROM job_parts WHERE job_id = ?`,
      [id]
    );
    const [history] = await db.query(
      `SELECT status, note, changed_at
       FROM status_history WHERE job_id = ?
       ORDER BY changed_at, id`,
      [id]
    );

    const job = jobs[0];
    // MySQL DECIMAL අගයන් string විදියට එන නිසා Number() කරනවා
    const partsTotal = parts.reduce((sum, p) => sum + Number(p.line_total), 0);
    const labour = Number(job.labour_cost);
    const advance = Number(job.advance_paid);
    const total = partsTotal + labour;

    res.json({
      ...job,
      parts,
      history,
      totals: {
        parts: round2(partsTotal),
        labour: round2(labour),
        total: round2(total),
        advance_paid: round2(advance),
        balance: round2(total - advance),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/jobs/:id/status
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `UPDATE jobs
       SET status = ?,
           delivered_at = IF(? = 'delivered', NOW(), delivered_at)
       WHERE id = ?`,
      [status, status, id]
    );
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ message: "Job not found" });
    }

    await conn.query(
      "INSERT INTO status_history (job_id, status, note) VALUES (?, ?, ?)",
      [id, status, note || null]
    );

    await conn.commit();
    res.json({ message: "Status updated", status });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};