import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const STEPS = [
  {
    n: "1",
    title: "Drop off your device",
    text: "The shop notes your phone or laptop, the fault, and anything you hand over with it. You get a printed receipt with a job number.",
  },
  {
    n: "2",
    title: "Follow the repair",
    text: "Enter your job number and the last 4 digits of your phone to see exactly which stage your device is at.",
  },
  {
    n: "3",
    title: "Get an SMS when it changes",
    text: "Every time the status changes, a message goes to your phone. No need to call the shop.",
  },
  {
    n: "4",
    title: "Collect it",
    text: "The cost breakdown shows parts, labour and your advance, so you know the balance before you arrive.",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-body">
          <p className="eyebrow">Smartphone &amp; laptop repairs</p>
          <h1>Know where your device is</h1>
          <p className="home-lead">
            Stop calling the shop to ask if your repair is done. Check the
            status yourself, any time, with the job number on your receipt.
          </p>
          <div className="home-actions">
            <Link to="/track" className="btn">Track my repair</Link>
            <Link to="/login" className="btn ghost">Shop staff login</Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2>How it works</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <article key={s.n} className="step-card">
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>What you can see</h2>
        <ul className="feature-list">
          <li>
            <b>Repair stage</b>
            Received, being checked, waiting for parts, under repair, or ready
            for pickup.
          </li>
          <li>
            <b>Cost breakdown</b>
            Every spare part with its price, plus labour, your advance, and the
            balance left to pay.
          </li>
          <li>
            <b>Update history</b>
            When each stage happened, so you can see how long a step has taken.
          </li>
          <li>
            <b>Expected date</b>
            The date the shop expects the repair to be finished.
          </li>
        </ul>
      </section>

      <section className="home-cta">
        <h2>Have a job number?</h2>
        <p>You'll find it on the receipt you got when you dropped off your device.</p>
        <Link to="/track" className="btn">Check my repair status</Link>
      </section>

      <Footer />
    </div>
  );
}