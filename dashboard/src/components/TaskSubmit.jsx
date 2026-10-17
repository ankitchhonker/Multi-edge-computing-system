import React, { useState } from "react";

const TASK_TYPES = [
  {
    key: "prime",
    icon: "🔢",
    label: "Prime Scan",
    desc: "Count all prime numbers up to N — pure math crunch",
  },
  {
    key: "monte-carlo",
    icon: "🎲",
    label: "Monte Carlo π",
    desc: "Throw N random darts to estimate π — like statistical sampling",
  },
  {
    key: "hash-chain",
    icon: "🔐",
    label: "Hash Chain",
    desc: "Chain SHA-256 hashes — simulates password-hashing workload",
  },
  {
    key: "matrix",
    icon: "📊",
    label: "Matrix Multiply",
    desc: "Multiply two large matrices — core operation behind AI & graphics",
  },
  {
    key: "compress",
    icon: "🗄️",
    label: "Data Compress",
    desc: "Run-length encode a data buffer — like ZIP compression",
  },
];

const SIZES = [
  { value: 100000,  label: "Small  (100K)" },
  { value: 500000,  label: "Medium (500K)" },
  { value: 2000000, label: "Large  (2M)" },
];

export default function TaskSubmit({ onSubmit }) {
  const [taskType, setTaskType] = useState("prime");
  const [size, setSize] = useState(500000);
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  const selected = TASK_TYPES.find((t) => t.key === taskType);

  const handle = async () => {
    setLoading(true);
    try {
      await onSubmit({ taskType, size: Number(size), urgent });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-panel">
      <div className="section-title" style={{ marginBottom: 6 }}>🎯 Submit a Task</div>
      <div className="submit-hint">
        Choose a task type and size. The system will automatically pick the best available edge node.
      </div>

      <div className="submit-form">
        <div className="form-field">
          <label className="form-label">Task Type</label>
          <select
            className="form-select"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
          >
            {TASK_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Workload Size</label>
          <select
            className="form-select"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Priority</label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            ⚡ Urgent (weights RTT 2x)
          </label>
        </div>

        <div className="form-field">
          <label className="form-label">&nbsp;</label>
          <button className="submit-btn" onClick={handle} disabled={loading}>
            {loading ? "⏳ Routing..." : "▶ Submit Task"}
          </button>
        </div>
      </div>

      <div className="task-desc">
        <strong>{selected?.icon} {selected?.label}:</strong> {selected?.desc}
        <br />
        <span style={{ marginTop: 4, display: "block" }}>
          Workload size controls how much CPU work the worker thread does.
          {urgent ? " ⚡ Urgent mode: the router will strongly prefer the lowest-latency node." : ""}
        </span>
      </div>
    </div>
  );
}
