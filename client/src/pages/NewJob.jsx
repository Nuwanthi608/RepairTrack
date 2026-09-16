import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const empty = {
  customer_name: "", phone: "", device_type: "phone", brand: "", model: "",
  serial_imei: "", fault_description: "", accessories: "",
  labour_cost: "", advance_paid: "", expected_date: "",
};

export default function NewJob() {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        labour_cost: Number(form.labour_cost) || 0,
        advance_paid: Number(form.advance_paid) || 0,
      };
      const result = await api("/jobs", { method: "POST", body });
      navigate(`/jobs/${result.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>New Job</h1>
      <form className="card form" onSubmit={submit}>
        <h3>Customer</h3>
        <div className="grid">
          <label>Name *<input name="customer_name" value={form.customer_name} onChange={update} required /></label>
          <label>Phone *<input name="phone" value={form.phone} onChange={update} placeholder="0771234567" required /></label>
        </div>

        <h3>Device</h3>
        <div className="grid">
          <label>Type *
            <select name="device_type" value={form.device_type} onChange={update}>
              <option value="phone">Phone</option>
              <option value="laptop">Laptop</option>
              <option value="tablet">Tablet</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Brand<input name="brand" value={form.brand} onChange={update} /></label>
          <label>Model<input name="model" value={form.model} onChange={update} /></label>
          <label>Serial / IMEI<input name="serial_imei" value={form.serial_imei} onChange={update} /></label>
        </div>
        <label>Fault description *
          <textarea name="fault_description" rows="3" value={form.fault_description} onChange={update} required />
        </label>
        <label>Accessories received
          <input name="accessories" value={form.accessories} onChange={update} placeholder="Charger, back cover..." />
        </label>

        <h3>Payment</h3>
        <div className="grid">
          <label>Labour cost (Rs.)<input type="number" min="0" name="labour_cost" value={form.labour_cost} onChange={update} /></label>
          <label>Advance paid (Rs.)<input type="number" min="0" name="advance_paid" value={form.advance_paid} onChange={update} /></label>
          <label>Expected date<input type="date" name="expected_date" value={form.expected_date} onChange={update} /></label>
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={saving}>{saving ? "Saving..." : "Create Job"}</button>
      </form>
    </div>
  );
}