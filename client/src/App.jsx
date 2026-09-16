import { Routes, Route, Link } from "react-router-dom";
import JobsList from "./pages/JobsList";
import NewJob from "./pages/NewJob";
import JobDetails from "./pages/JobDetails";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">🔧 RepairTrack</Link>
        <Link to="/jobs/new" className="btn">+ New Job</Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<JobsList />} />
          <Route path="/jobs/new" element={<NewJob />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
        </Routes>
      </main>
    </div>
  );
}