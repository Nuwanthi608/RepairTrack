import { Routes, Route, Link, Outlet, Navigate, useNavigate } from "react-router-dom";
import JobsList from "./pages/JobsList";
import NewJob from "./pages/NewJob";
import JobDetails from "./pages/JobDetails";
import TrackJob from "./pages/TrackJob";
import Login from "./pages/Login";
import { getToken, getUser, clearAuth } from "./api";
import "./App.css";

function OwnerLayout() {
  const navigate = useNavigate();

  // Login වෙලා නැත්නම් login page එකට
  if (!getToken()) return <Navigate to="/login" replace />;

  const user = getUser();

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">🔧 RepairTrack</Link>
        <nav className="nav">
          <Link to="/track" target="_blank" className="nav-link">
            Customer page ↗
          </Link>
          <Link to="/jobs/new" className="btn">+ New Job</Link>
          <span className="nav-user">{user?.name}</span>
          <button className="btn secondary" onClick={logout}>Logout</button>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Login නැතුව */}
      <Route path="/login" element={<Login />} />
      <Route path="/track/:jobNumber?" element={<TrackJob />} />

      {/* Shop owner ට විතරයි */}
      <Route element={<OwnerLayout />}>
        <Route path="/" element={<JobsList />} />
        <Route path="/jobs/new" element={<NewJob />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}