import { Routes, Route, Link, Outlet } from "react-router-dom";
import JobsList from "./pages/JobsList";
import NewJob from "./pages/NewJob";
import JobDetails from "./pages/JobDetails";
import TrackJob from "./pages/TrackJob";
import "./App.css";

function OwnerLayout() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">🔧 RepairTrack</Link>
        <nav className="nav">
          <Link to="/track" target="_blank" className="nav-link">
            Customer page ↗
          </Link>
          <Link to="/jobs/new" className="btn">+ New Job</Link>
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
      {/* Customer ලාට: login නැහැ, owner header නැහැ */}
      <Route path="/track/:jobNumber?" element={<TrackJob />} />

      {/* Shop owner ට */}
      <Route element={<OwnerLayout />}>
        <Route path="/" element={<JobsList />} />
        <Route path="/jobs/new" element={<NewJob />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
      </Route>
    </Routes>
  );
}