import React from "react";

function Sparkline({ data, width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke="#00D4FF"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* latest value dot */}
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={3}
        fill="#00D4FF"
      />
    </svg>
  );
}

function getLoadClass(load) {
  if (load > 70) return "high";
  if (load > 40) return "medium";
  return "low";
}

function getStatus(n) {
  if (n.down) return "offline";
  if (n.disabled) return "disabled";
  if (n.load > 60) return "busy";
  return "online";
}

export default function NodeCard({ node: n, rttHistory, isActive, onToggle }) {
  const status = getStatus(n);
  const load = n.load || 0;

  return (
    <div className={`node-card ${status === "offline" ? "down" : ""} ${n.disabled ? "disabled" : ""} ${isActive ? "active" : ""}`}>
      <div className="node-header">
        <div className="node-name-group">
          <span className={`status-dot ${status}`} />
          <span className="node-name">{n.name}</span>
        </div>
        <span className={`node-badge badge-${status}`}>
          {status === "online" ? "Online" :
           status === "busy" ? "Busy" :
           status === "disabled" ? "Killed" : "Offline"}
        </span>
      </div>

      {n.down ? (
        <div style={{ color: "#F85149", fontWeight: 600, padding: "12px 0" }}>Node is offline</div>
      ) : n.disabled ? (
        <div style={{ color: "#E3B341", fontWeight: 600, padding: "12px 0" }}>
          ⚠️ Manually disabled for demo
          <div style={{ fontSize: 12, color: "#8B949E", marginTop: 4 }}>
            Main server will skip this node
          </div>
        </div>
      ) : (
        <>
          <div className="node-metrics">
            <div className="metric">
              <span className="metric-label">RTT Delay</span>
              <span className="metric-value highlight">{n.rtt} ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Workers</span>
              <span className="metric-value">{n.activeWorkers} / {n.maxWorkers} active</span>
            </div>
            <div className="metric">
              <span className="metric-label">Queue</span>
              <span className="metric-value">{n.queueLength} waiting</span>
            </div>
            <div className="metric">
              <span className="metric-label">Scheduling</span>
              <span className="metric-value">{n.scheduling}</span>
            </div>
            <div className="metric">
              <span className="metric-label">CPU Avg</span>
              <span className="metric-value">{n.cpuLoadAvg}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Free RAM</span>
              <span className="metric-value">{n.freeMemMB} MB</span>
            </div>
          </div>

          <div className="load-bar-wrap">
            <div className="load-bar-label">
              <span>Load</span>
              <span style={{ color: load > 70 ? "#F85149" : load > 40 ? "#E3B341" : "#3FB950" }}>
                {load}%
              </span>
            </div>
            <div className="load-bar">
              <div
                className={`load-bar-fill ${getLoadClass(load)}`}
                style={{ width: `${load}%` }}
              />
            </div>
          </div>

          {/* Active task progress */}
          {n.activeTasks && n.activeTasks.length > 0 && (
            <div className="task-progress">
              <div>⚡ Running: <strong>{n.activeTasks[0].taskType}</strong> — {n.activeTasks[0].progress}%</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${n.activeTasks[0].progress}%` }} />
              </div>
            </div>
          )}

          {/* RTT Sparkline */}
          {rttHistory.length > 2 && (
            <div className="sparkline">
              <div className="sparkline-label">RTT history (last {rttHistory.length} reads)</div>
              <Sparkline data={rttHistory} width={220} height={36} />
            </div>
          )}
        </>
      )}

      <div className="node-footer">
        {n.disabled ? (
          <button className="revive-btn" onClick={onToggle}>Revive Node</button>
        ) : (
          <button className="kill-btn" onClick={onToggle}>
            {n.down ? "Node Down" : "Kill for Demo"}
          </button>
        )}
      </div>
    </div>
  );
}
