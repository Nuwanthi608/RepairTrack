import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATUS_LABELS, formatDate } from "../api";

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(status ? `/jobs?status=${status}` : "/jobs")
      .then((data) => { setJobs(data); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);

  const q = search.trim().toLowerCase();
  const filtered = jobs.filter((j) =>
    !q ||
    j.job_number.toLowerCase().includes(q) ||
    j.customer_name.toLowerCase().includes(q) ||
    j.phone.includes(q)
  );

  return (
    <div>
      <h1>Jobs</h1>

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