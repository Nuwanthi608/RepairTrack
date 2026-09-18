import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATUS_LABELS, formatDate } from "../api";

// Dashboard එකේ උඩ පෙන්නන tabs (delivered/cancelled වලට tab එකක් නැහැ)
const TABS = ["received", "diagnosing", "waiting_for_parts", "repairing", "ready"];

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/jobs")
      .then((data) => { setJobs(data); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});

  // කඩේ දැන් අතේ තියෙන උපකරණ ගණන
  const inShop = TABS.reduce((sum, s) => sum + (counts[s] || 0), 0);

  const q = search.trim().toLowerCase();
  const filtered = jobs.filter((j) => {
    if (status && j.status !== status) return false;
    if (!q) return true;
    return (
      j.job_number.toLowerCase().includes(q) ||
      j.customer_name.toLowerCase().includes(q) ||
      j.phone.includes(q)
    );
  });

  return (
    <div>
      <div className="title-row">
        <h1>Jobs</h1>
        <span className="muted">{inShop} device{inShop === 1 ? "" : "s"} in shop</span>
      </div>

      <div className="status-cards">
        <button
          className={`status-card ${status === "" ? "active" : ""}`}
          onClick={() => setStatus("")}
        >
          <b>{jobs.length}</b>
          <span>All</span>
        </button>
        {TABS.map((s) => (
          <button
            key={s}
            className={`status-card ${status === s ? "active" : ""}`}
            onClick={() => setStatus(status === s ? "" : s)}
          >
            <b>{counts[s] || 0}</b>
            <span>{STATUS_LABELS[s]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input
          placeholder="Search job no, name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="muted">No jobs found.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job No</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id}>
                  <td><Link to={`/jobs/${j.id}`}>{j.job_number}</Link></td>
                  <td>{j.customer_name}<br /><span className="muted">{j.phone}</span></td>
                  <td>{[j.brand, j.model].filter(Boolean).join(" ") || j.device_type}</td>
                  <td><span className={`badge ${j.status}`}>{STATUS_LABELS[j.status]}</span></td>
                  <td>{formatDate(j.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}