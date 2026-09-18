import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATUS_LABELS } from "../api";

const TABS = ["received", "diagnosing", "waiting_for_parts", "repairing", "ready"];
const DAY = 24 * 60 * 60 * 1000;

const daysSince = (date) => Math.floor((Date.now() - new Date(date)) / DAY);

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
      <div className="bench">
        <span className="bench-count">{inShop}</span>
        <span className="bench-label">
          <b>{inShop === 1 ? "device" : "devices"} on the bench</b>
          {jobs.length - inShop > 0 && `${jobs.length - inShop} closed`}
        </span>
      </div>

      <div className="filters">
        <button
          className={`chip ${status === "" ? "active" : ""}`}
          onClick={() => setStatus("")}
        >
          <span className="n">{jobs.length}</span> All
        </button>
        {TABS.map((s) => (
          <button
            key={s}
            className={`chip ${s} ${status === s ? "active" : ""} ${counts[s] ? "" : "zero"}`}
            onClick={() => setStatus(status === s ? "" : s)}
          >
            <span className={`dot s-${s}`} />
            <span className="n">{counts[s] || 0}</span> {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input
          placeholder="Search job number, name or phone"
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
        <p className="muted">Loading jobs…</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          {jobs.length === 0
            ? "No devices yet. Use + New Job when a customer drops one off."
            : "No jobs match this filter."}
        </p>
      ) : (
        <>
          <div className="job-head">
            <span />
            <span>Job number</span>
            <span>Customer</span>
            <span className="job-device">Device</span>
            <span>Status</span>
            <span className="age">In shop</span>
          </div>

          <div className="board">
            {filtered.map((j) => {
              const days = daysSince(j.created_at);
              const open = !["delivered", "cancelled"].includes(j.status);
              const late =
                open && j.expected_date && new Date(j.expected_date) < new Date();

              return (
                <Link key={j.id} to={`/jobs/${j.id}`} className="job-row">
                  <span className={`spine s-${j.status}`} />
                  <span className="job-no">{j.job_number}</span>
                  <span>
                    {j.customer_name}
                    <br />
                    <span className="job-sub">{j.phone}</span>
                  </span>
                  <span className="job-device">
                    {[j.brand, j.model].filter(Boolean).join(" ") || j.device_type}
                    <br />
                    <span className="job-sub">{j.device_type}</span>
                  </span>
                  <span>
                    <span className={`badge ${j.status}`}>{STATUS_LABELS[j.status]}</span>
                  </span>
                  <span className={`age ${late ? "late" : ""}`}>
                    {days === 0 ? "today" : `${days}d`}
                    {late && <br />}
                    {late && <span className="job-sub">overdue</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}