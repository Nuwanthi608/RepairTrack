import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  const repoUrl = "https://github.com/your-username/RepairTrack";

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          
          <span className="footer-dim">Job tracking for repair shops</span>
        </div>
        <nav className="footer-col footer-links">
          <Link to="/">Job board</Link>
                    <Link to="/welcome">For customers</Link>
          <Link to="/track">Track a repair</Link>
          
        </nav>
        <span className="footer-dim">{year} · Nuwanthi Piyathilaka</span>
      </div>
    </footer>
  );
}