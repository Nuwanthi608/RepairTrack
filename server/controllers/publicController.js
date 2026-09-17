const db = require("../config/db");

const round2 = (n) => Math.round(n * 100) / 100;

const NOT_FOUND =
  "No job found. Please check the job number and the last 4 digits of your phone.";

// POST /api/public/track
exports.trackJob = async (req, res) => {
  const jobNumber = String(req.body.job_number || "").trim().toUpperCase();
  const last4 = String(req.body.phone_last4 || "").trim();

  if (!/^RT-[A-Z0-9]{6}$/.test(jobNumber) || !/^\d{4}$/.test(last4)) {
    return res.status(400).json({
      message: "Enter a job number like RT-ABC123 and 4 phone digits",
    });
  }

  try {
    const [jobs] = await db.query(
      `SELECT j.id, j.job_number, j.device_type, j.brand, j.model, j.status,
              j.labour_cost, j.advance_paid, j.expected_date,
              j.created_at, j.updated_at, c.name AS customer_name
       FROM jobs j
       JOIN customers c ON c.id = j.customer_id
       WHERE j.job_number = ? AND RIGHT(c.phone, 4) = ?`,
      [jobNumber, last4]
    );

    // වැරදි job number එකටත් වැරදි phone digits වලටත් එකම පණිවිඩය
    if (!jobs.length) return res.status(404).json({ message: NOT_FOUND });

    const job = jobs[0];

    const [parts] = await db.query(
      `SELECT part_name, quantity, quantity * unit_cost AS line_total
       FROM job_parts WHERE job_id = ? ORDER BY id`,
      [job.id]
    );

    // Shop එකේ internal notes customer ට පෙන්නන්නේ නැහැ
    const [history] = await db.query(
      `SELECT status, changed_at
       FROM status_history WHERE job_id = ?
       ORDER BY changed_at, id`,
      [job.id]
    );

    const partsTotal = parts.reduce((sum, p) => sum + Number(p.line_total), 0);
    const labour = Number(job.labour_cost);
    const advance = Number(job.advance_paid);
    const total = partsTotal + labour;

    res.json({
      job_number: job.job_number,
      customer_first_name: job.customer_name.split(" ")[0],
      device: [job.brand, job.model].filter(Boolean).join(" ") || job.device_type,
      device_type: job.device_type,
      status: job.status,
      expected_date: job.expected_date,
      received_at: job.created_at,
      last_updated: job.updated_at,
      parts: parts.map((p) => ({
        part_name: p.part_name,
        quantity: p.quantity,
        line_total: round2(Number(p.line_total)),
      })),
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
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};