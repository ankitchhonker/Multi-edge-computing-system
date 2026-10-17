import React from "react";

const TASK_TYPES = [
  { key: "prime",       label: "Prime Scan" },
  { key: "monte-carlo", label: "Monte Carlo π" },
  { key: "hash-chain",  label: "Hash Chain" },
  { key: "matrix",      label: "Matrix Multiply" },
  { key: "compress",    label: "Compression" },
];

export default function HeroBanner({ onlineNodes, totalNodes, totalTasks, queuedTasks, demoMode, onDemoToggle }) {
  return (
    <div className="hero">
      <div className="hero-top">
        <div className="hero-title-group">
          <div className="hero-title">
            🌐 Edge Task Delegation
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          </div>
          <div className="hero-subtitle">
            Multi-Access Edge Computing — real CPU work, real-time routing, zero fakes
          </div>
        </div>
        <button
          className={`demo-btn ${demoMode ? "on" : "off"}`}
          onClick={onDemoToggle}
        >
          {demoMode ? "🔴 Stop Demo" : "▶️ Auto Demo"}
        </button>
      </div>

      <div className="hero-stats">
        <div className="stat-box">
          <div className="stat-value">{onlineNodes}/{totalNodes}</div>
          <div className="stat-label">Nodes Online</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{queuedTasks}</div>
          <div className="stat-label">In Queue</div>
        </div>
        <div className="stat-box" style={{ minWidth: 200 }}>
          <div className="stat-label" style={{ marginBottom: 6 }}>Task Types Available</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TASK_TYPES.map((t) => (
              <span key={t.key} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 10,
                background: "rgba(0,212,255,0.1)", color: "#00D4FF",
                border: "1px solid rgba(0,212,255,0.2)"
              }}>{t.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
