import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, STATUS_LABELS, formatRs, formatDate } from "../api";

const LOCKED = ["delivered", "cancelled"];
const emptyPart = { part_name: "", quantity: 1, unit_cost: "" };
const PUBLIC_URL = window.location.origin;

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [part, setPart] = useState(emptyPart);
  const [payment, setPayment] = useState({ labour_cost: "", advance_paid: "" });

  const load = useCallback(() => {
    api(`/jobs/${id}`)
      .then((data) => {
        setJob(data);
        setNewStatus(data.status);
        setPayment({
          labour_cost: data.totals.labour,
          advance_paid: data.totals.advance_paid,
        });
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // හැම save එකකටම පොදු helper එක: save කරලා data එක reload කරනවා
  const run = async (action) => {
    setSaving(true);
    setError("");
    try {
      await action();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = (e) => {
    e.preventDefault();
    if (newStatus === job.status && !note) return;
    run(async () => {
      await api(`/jobs/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus, note },
      });
      setNote("");
    });
  };

  const addPart = (e) => {
    e.preventDefault();
    run(async () => {
      await api(`/jobs/${id}/parts`, {
        method: "POST",
        body: {
          part_name: part.part_name,
          quantity: Number(part.quantity),
          unit_cost: Number(part.unit_cost),
        },
      });
      setPart(emptyPart);
    });
  };

  const removePart = (partId) => {
    if (!window.confirm("Remove this part?")) return;
    run(() => api(`/jobs/${id}/parts/${partId}`, { method: "DELETE" }));
  };

  const savePayment = (e) => {
    e.preventDefault();
    run(() =>
      api(`/jobs/${id}/payment`, {
        method: "PATCH",
        body: {
          labour_cost: Number(payment.labour_cost) || 0,
          advance_paid: Number(payment.advance_paid) || 0,
        },
      })
    );
  };

  if (error && !job) return <p className="error">{error}</p>;
  if (!job) return <p>Loading...</p>;

  const locked = LOCKED.includes(job.status);

  return (
    <div>
      <div className="page-actions">
        <Link to="/">← Back to jobs</Link>
        <button className="btn secondary" onClick={() => window.print()}>
          🖨 Print receipt
        </button>
      </div>

      <div className="title-row">
        <h1>{job.job_number}</h1>
        <span className={`badge ${job.status}`}>{STATUS_LABELS[job.status]}</span>
      </div>

      {error && <p className="error">{error}</p>}

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
            <input
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn" disabled={saving}>
              {saving ? "Saving..." : "Update"}
            </button>
          </form>

          <h3>Payment</h3>
          <form onSubmit={savePayment} className="form">
            <div className="grid">
              <label>Labour cost (Rs.)
                <input
                  type="number" min="0" step="0.01"
                  value={payment.labour_cost}
                  onChange={(e) => setPayment({ ...payment, labour_cost: e.target.value })}
                />
              </label>
              <label>Advance paid (Rs.)
                <input
                  type="number" min="0" step="0.01"
                  value={payment.advance_paid}
                  onChange={(e) => setPayment({ ...payment, advance_paid: e.target.value })}
                />
              </label>
            </div>
            <button className="btn secondary" disabled={saving}>Save payment</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3>Spare parts & bill</h3>

        {job.parts.length === 0 ? (
          <p className="muted">No parts added yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Part</th>
                  <th className="right">Qty</th>
                  <th className="right">Unit cost</th>
                  <th className="right">Total</th>
                  {!locked && <th></th>}
                </tr>
              </thead>
              <tbody>
                {job.parts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.part_name}</td>
                    <td className="right">{p.quantity}</td>
                    <td className="right">{formatRs(p.unit_cost)}</td>
                    <td className="right">{formatRs(p.line_total)}</td>
                    {!locked && (
                      <td className="right">
                        <button
                          className="icon-btn"
                          onClick={() => removePart(p.id)}
                          disabled={saving}
                          title="Remove part"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {locked ? (
          <p className="muted">This job is {STATUS_LABELS[job.status].toLowerCase()}, so parts can't be changed.</p>
        ) : (
          <form onSubmit={addPart} className="part-form">
            <input
              placeholder="Part name (e.g. Display panel)"
              value={part.part_name}
              onChange={(e) => setPart({ ...part, part_name: e.target.value })}
              required
            />
            <input
              type="number" min="1" step="1" placeholder="Qty"
              value={part.quantity}
              onChange={(e) => setPart({ ...part, quantity: e.target.value })}
              required
            />
            <input
              type="number" min="0" step="0.01" placeholder="Unit cost (Rs.)"
              value={part.unit_cost}
              onChange={(e) => setPart({ ...part, unit_cost: e.target.value })}
              required
            />
            <button className="btn" disabled={saving}>+ Add part</button>
          </form>
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

      <div className="card">
        <h3>SMS sent</h3>
        {job.sms.length === 0 ? (
          <p className="muted">No SMS sent yet.</p>
        ) : (
          <ul className="timeline">
            {job.sms.map((s, i) => (
              <li key={i}>
                <span className={`badge sms-${s.send_status}`}>{s.send_status}</span>
                <span className="muted"> {formatDate(s.sent_at)}</span>
                <div>{s.message}</div>
              </li>
            ))}
          </ul>
        )}
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

      {/* Print කරද්දී විතරක් පේනවා */}
      <div className="receipt">
        <h2>RepairTrack — Job Receipt</h2>
        <p className="receipt-jobno">{job.job_number}</p>
        <table className="receipt-table">
          <tbody>
            <tr><td>Customer</td><td>{job.customer_name} ({job.phone})</td></tr>
            <tr><td>Device</td><td>{job.device_type} {[job.brand, job.model].filter(Boolean).join(" ")}</td></tr>
            <tr><td>Serial / IMEI</td><td>{job.serial_imei || "-"}</td></tr>
            <tr><td>Fault</td><td>{job.fault_description}</td></tr>
            <tr><td>Accessories</td><td>{job.accessories || "-"}</td></tr>
            <tr><td>Received</td><td>{formatDate(job.created_at)}</td></tr>
            <tr><td>Expected</td><td>{job.expected_date ? new Date(job.expected_date).toLocaleDateString("en-LK") : "-"}</td></tr>
            <tr><td>Total</td><td>{formatRs(job.totals.total)}</td></tr>
            <tr><td>Advance paid</td><td>{formatRs(job.totals.advance_paid)}</td></tr>
            <tr><td><b>Balance</b></td><td><b>{formatRs(job.totals.balance)}</b></td></tr>
          </tbody>
        </table>
        <p className="receipt-foot">
          Check your repair status online:<br />
          {PUBLIC_URL}/track/{job.job_number}<br />
          (Job number + last 4 digits of your phone)
        </p>
      </div>
    </div>
  );
}