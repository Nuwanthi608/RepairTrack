const db = require("../config/db");

const STATUS_TEXT = {
  diagnosing: "is being checked by our technician",
  waiting_for_parts: "is waiting for a spare part",
  repairing: "is being repaired",
  ready: "is READY for pickup",
  delivered: "has been collected. Thank you!",
  cancelled: "repair was cancelled. Please contact us",
};

// 0771234567 -> 94771234567
const toIntl = (phone) => "94" + phone.slice(1);

function buildMessage(job) {
  const device = [job.brand, job.model].filter(Boolean).join(" ") || job.device_type;
  const link = `${process.env.PUBLIC_URL}/track/${job.job_number}`;

  if (job.status === "received") {
    return `RepairTrack: We received your ${device}. Job no: ${job.job_number}. Track status: ${link}`;
  }
  return `RepairTrack: Your ${device} (${job.job_number}) ${STATUS_TEXT[job.status]}. ${link}`;
}

async function sendViaNotifyLk(phone, message) {
  const params = new URLSearchParams({
    user_id: process.env.NOTIFY_USER_ID,
    api_key: process.env.NOTIFY_API_KEY,
    sender_id: process.env.NOTIFY_SENDER_ID,
    to: toIntl(phone),
    message,
  });
  const res = await fetch(`https://app.notify.lk/api/v1/send?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
}

exports.notifyCustomer = async (jobId) => {
  const [rows] = await db.query(
    `SELECT j.job_number, j.status, j.brand, j.model, j.device_type, c.phone
     FROM jobs j JOIN customers c ON c.id = j.customer_id
     WHERE j.id = ?`,
    [jobId]
  );
  if (!rows.length) return;

  const job = rows[0];
  const message = buildMessage(job);
  let sendStatus;

  try {
    if (process.env.SMS_PROVIDER === "notifylk") {
      await sendViaNotifyLk(job.phone, message);
      sendStatus = "sent";
    } else {
      console.log(`📱 [SMS simulated] to ${job.phone}: ${message}`);
      sendStatus = "simulated";
    }
  } catch (err) {
    console.error("SMS failed:", err.message);
    sendStatus = "failed";
  }

  await db.query(
    "INSERT INTO sms_logs (job_id, phone, message, send_status) VALUES (?, ?, ?, ?)",
    [jobId, job.phone, message, sendStatus]
  );
};