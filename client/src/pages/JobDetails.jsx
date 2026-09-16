import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, STATUS_LABELS, formatRs, formatDate } from "../api";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api(`/jobs/${id}`)
      .then((data) => { setJob(data); setNewStatus(data.status); setError(""); })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (e) => {
    e.preventDefault();
    if (newStatus === job.status && !note) return;
    setSaving(true);
    try {
      await api(`/jobs/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus, note },
      });
      setNote("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !job) return <p className="error">{error}</p>;
  if (!job) return <p>Loading...</p>;

  return (
    <div>
      <Link to="/">← Back to jobs</Link>
      <div className="title-row">
        <h1>{job.job_number}</h1>
        <span className={`badge ${job.status}`}>{STATUS_LABELS[job.status]}</span>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Customer</h3>
          <p><b>{job.customer_name}</b><br />{job.phone}</p>
          <h3>Device</h3>
          <p>
            {job.device_type} · {[job.brand, job.model].filter(Boolean).join(" ") || "-"}<br />
            <span className="muted">Serial/IMEI: {job.serial_imei || "-"}</span>
          </p>
          <p><b>Fault:</b> {job.fault_description}</p>
          <p><b>Accessories:</b> {job.accessories || "-"}</p>
          <p className="muted">
            Received: {formatDate(job.created_at)}<br />
            Expected: {job.expected_date ? new Date(job.expected_date).toLocaleDateString("en-LK") : "-"}
          </p>
        </div>

        <div className="card">
          <h3>Update status</h3>
          <form onSubmit={changeStatus} className="form">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={saving}>{saving ? "Saving..." : "Update"}</button>
          </form>

          <h3>Bill</h3>
          {job.parts.length > 0 && (
            <table className="bill">
              <tbody>
                {job.parts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.part_name} × {p.quantity}</td>
                    <td className="right">{formatRs(p.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <table className="bill">
            <tbody>
              <tr><td>Parts</td><td className="right">{formatRs(job.totals.parts)}</td></tr>
              <tr><td>Labour</td><td className="right">{formatRs(job.totals.labour)}</td></tr>
              <tr className="strong"><td>Total</td><td className="right">{formatRs(job.totals.total)}</td></tr>
              <tr><td>Advance paid</td><td className="right">- {formatRs(job.totals.advance_paid)}</td></tr>
              <tr className="strong"><td>Balance</td><td className="right">{formatRs(job.totals.balance)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>History</h3>
        <ul className="timeline">
          {job.history.map((h, i) => (
            <li key={i}>
              <span className={`badge ${h.status}`}>{STATUS_LABELS[h.status] || h.status}</span>
              <span className="muted"> {formatDate(h.changed_at)}</span>
              {h.note && <div>{h.note}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}