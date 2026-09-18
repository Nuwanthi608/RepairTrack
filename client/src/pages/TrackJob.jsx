import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, STATUS_LABELS, formatRs, formatDate } from "../api";

const STEPS = [
  { key: "received", label: "Received" },
  { key: "diagnosing", label: "Checking" },
  { key: "repairing", label: "Repairing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Collected" },
];

// waiting_for_parts එක "Repairing" අදියරේම කොටසක් විදියට පෙන්නනවා
const STEP_INDEX = {
  received: 0,
  diagnosing: 1,
  waiting_for_parts: 2,
  repairing: 2,
  ready: 3,
  delivered: 4,
};

const MESSAGES = {
  received: "We have received your device. A technician will check it soon.",
  diagnosing: "Our technician is checking your device to find the problem.",
  waiting_for_parts: "We are waiting for a spare part to arrive.",
  repairing: "Your device is being repaired.",
  ready: "Your device is ready! Please visit the shop to collect it.",
  delivered: "Your device has been collected. Thank you for choosing us!",
  cancelled: "This repair was cancelled. Please contact the shop for details.",
};

export default function TrackJob() {
  const { jobNumber } = useParams();
  const [form, setForm] = useState({
    job_number: jobNumber || "",
    phone_last4: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
           const data = await api("/public/track", { method: "POST", body: form, auth: false });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = result ? STEP_INDEX[result.status] : -1;

  return (
    <div className="track-page">
      <header className="track-header">
        <h1>🔧 RepairTrack</h1>
        <p>Check your device repair status</p>
      </header>

            {localStorage.getItem("rt_token") && (
        <p className="back-link">
          <Link to="/">← Back to dashboard</Link>
        </p>
      )}

      <form className="card form track-form" onSubmit={submit}>
        <label>Job number
          <input
            placeholder="RT-ABC123"
            value={form.job_number}
            onChange={(e) =>
              setForm({ ...form, job_number: e.target.value.toUpperCase() })
            }
            required
          />
        </label>
        <label>Last 4 digits of your phone number
          <input
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            value={form.phone_last4}
            onChange={(e) =>
              setForm({ ...form, phone_last4: e.target.value.replace(/\D/g, "") })
            }
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={loading}>
          {loading ? "Checking..." : "Check status"}
        </button>
      </form>

      {result && (
        <div className="card track-result">
          <p className="muted">Hi {result.customer_first_name},</p>
          <div className="title-row">
            <h2>{result.device}</h2>
            <span className={`badge ${result.status}`}>
              {STATUS_LABELS[result.status]}
            </span>
          </div>
          <p className="muted">Job {result.job_number}</p>

          {result.status === "cancelled" ? (
            <div className="notice cancelled-box">{MESSAGES.cancelled}</div>
          ) : (
            <>
              <div className="stepper">
                {STEPS.map((s, i) => (
                  <div
                    key={s.key}
                    className={`step ${
                      i < currentStep ? "done" : i === currentStep ? "current" : ""
                    }`}
                  >
                    <div className="dot">{i < currentStep ? "✓" : i + 1}</div>
                    <div>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className={`notice ${result.status === "ready" ? "ready-box" : ""}`}>
                {MESSAGES[result.status]}
              </div>
            </>
          )}

          <p className="muted">
            Received: {formatDate(result.received_at)}<br />
            Expected: {result.expected_date
              ? new Date(result.expected_date).toLocaleDateString("en-LK")
              : "Not set yet"}<br />
            Last updated: {formatDate(result.last_updated)}
          </p>

          <h3>Cost breakdown</h3>
          {result.parts.length > 0 && (
            <table className="bill">
              <tbody>
                {result.parts.map((p, i) => (
                  <tr key={i}>
                    <td>{p.part_name} × {p.quantity}</td>
                    <td className="right">{formatRs(p.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <table className="bill">
            <tbody>
              <tr><td>Parts</td><td className="right">{formatRs(result.totals.parts)}</td></tr>
              <tr><td>Labour</td><td className="right">{formatRs(result.totals.labour)}</td></tr>
              <tr className="strong"><td>Total</td><td className="right">{formatRs(result.totals.total)}</td></tr>
              <tr><td>Advance paid</td><td className="right">- {formatRs(result.totals.advance_paid)}</td></tr>
              <tr className="strong"><td>Balance to pay</td><td className="right">{formatRs(result.totals.balance)}</td></tr>
            </tbody>
          </table>

          <h3>Updates</h3>
          <ul className="timeline">
            {result.history.map((h, i) => (
              <li key={i}>
                <span className={`badge ${h.status}`}>
                  {STATUS_LABELS[h.status] || h.status}
                </span>
                <span className="muted"> {formatDate(h.changed_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}