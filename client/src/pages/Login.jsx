import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { api, saveAuth, getToken } from "../api";
import Footer from "../components/Footer";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (getToken()) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: form,
        auth: false,
      });
      saveAuth(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-card">
          <p className="eyebrow">Smartphone &amp; laptop</p>
          <h1>RepairTrack</h1>
          <p className="brand-sub">Job tracking</p>
          <p className="tagline">
            Every device gets a job number, so nobody has to ask
            &ldquo;is mine ready yet?&rdquo; over the phone.
          </p>

          <form className="form login-form" onSubmit={submit}>
            <label>Email
              <input
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>Password
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

                    <p className="login-alt">
            Are you a customer? <Link to="/welcome">See how tracking works</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}