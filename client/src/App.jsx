import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, Outlet, Navigate, useNavigate } from "react-router-dom";
import JobsList from "./pages/JobsList";
import NewJob from "./pages/NewJob";
import JobDetails from "./pages/JobDetails";
import TrackJob from "./pages/TrackJob";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import { getToken, getUser, clearAuth } from "./api";
import "./App.css";

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // පිටතින් click කළාම menu එක වැහෙනවා
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const roleLabel = user?.role === "owner" ? "Owner" : "Technician";
  const initials = (user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-trigger" onClick={() => setOpen(!open)}>
        <span className="avatar">{initials}</span>
        <span className="user-trigger-text">
          {roleLabel}
          <span className="caret">{open ? "▴" : "▾"}</span>
        </span>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-head">
            <span className="avatar big">{initials}</span>
            <div>
              <b>{user?.name}</b>
              <span className="user-role">{roleLabel}</span>
            </div>
          </div>

          <dl className="user-facts">
            <dt>Email</dt>
            <dd>{user?.email || "—"}</dd>
            <dt>Access</dt>
            <dd>
              {user?.role === "owner"
                ? "Full access to jobs, parts and billing"
                : "Can update jobs and add parts"}
            </dd>
          </dl>

          <button className="btn secondary user-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function OwnerLayout() {
  const navigate = useNavigate();

  if (!getToken()) return <Navigate to="/login" replace />;

  const user = getUser();

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">RepairTrack</Link>
        <nav className="nav">
          <Link to="/track" className="nav-link">Customer page</Link>
          <Link to="/jobs/new" className="btn">+ New Job</Link>
          <UserMenu user={user} onLogout={logout} />
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Login නැතුව */}
      <Route path="/welcome" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/track/:jobNumber?" element={<TrackJob />} />

      {/* Shop staff ට විතරයි */}
      <Route element={<OwnerLayout />}>
        <Route path="/" element={<JobsList />} />
        <Route path="/jobs/new" element={<NewJob />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}