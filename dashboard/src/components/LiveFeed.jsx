import React from "react";

const TASK_ICONS = {
  prime:        "🔢",
  "monte-carlo": "🎲",
  "hash-chain":  "🔐",
  matrix:       "📊",
  compress:     "🗄️",
};

function timeAgo(id) {
  if (!id) return "";
  const ms = Date.now() - (typeof id === "number" ? id : 0);
  if (ms < 5000)  return "just now";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  return `${Math.floor(ms / 60000)}m ago`;
}

function FeedRow({ ev }) {
  if (ev.type === "complete") {
    const icon = ev.usedCloud ? "☁️" : (TASK_ICONS[ev.taskType] || "⚙️");
    return (
      <div className={`feed-row ${ev.usedCloud ? "cloud" : ""}`}>
        <div className="feed-icon">{icon}</div>
        <div className="feed-body">
          <div className="feed-main">
            <span className={`feed-chip ${ev.usedCloud ? "chip-cloud" : "chip-node"}`}>
              {ev.chosenNode || "CLOUD"}
            </span>
            <span className="feed-chip chip-task">{ev.taskType || "prime"}</span>
            {ev.urgent && <span className="feed-chip chip-retry">⚡ URGENT</span>}
            <span className="feed-chip chip-green">{ev.runMs}ms</span>
            {ev.score && <span style={{ fontSize: 12, color: "#8B949E" }}>score: {ev.score}</span>}
          </div>
          {ev.resultLabel && (
            <div className="feed-sub">→ {ev.resultLabel}</div>
          )}
          {ev.usedCloud && (
            <div className="feed-sub">⚠️ All edge nodes were unavailable — fell back to cloud</div>
          )}
        </div>
        <div className="feed-time">{timeAgo(ev.id)}</div>
      </div>
    );
  }

  if (ev.type === "retry") {
    return (
      <div className="feed-row retry">
        <div className="feed-icon">🔄</div>
        <div className="feed-body">
          <div className="feed-main">
            <span className="feed-chip chip-retry">RETRY</span>
            <span style={{ fontSize: 13 }}>{ev.failedNode} failed — trying another node</span>
          </div>
        </div>
        <div className="feed-time">{timeAgo(ev.id)}</div>
      </div>
    );
  }

  if (ev.type === "cloud") {
    return (
      <div className="feed-row cloud">
        <div className="feed-icon">☁️</div>
        <div className="feed-body">
          <div className="feed-main">
            <span className="feed-chip chip-cloud">CLOUD FALLBACK</span>
            <span style={{ fontSize: 13 }}>{ev.reason}</span>
          </div>
        </div>
        <div className="feed-time">{timeAgo(ev.id)}</div>
      </div>
    );
  }

  if (ev.type === "disabled" || ev.type === "enabled") {
    return (
      <div className="feed-row">
        <div className="feed-icon">{ev.type === "disabled" ? "🔴" : "🟢"}</div>
        <div className="feed-body">
          <div className="feed-main">
            <span className={`feed-chip ${ev.type === "disabled" ? "chip-retry" : "chip-green"}`}>
              {ev.name}
            </span>
            <span style={{ fontSize: 13 }}>
              {ev.type === "disabled" ? "killed for demo" : "revived"}
            </span>
          </div>
        </div>
        <div className="feed-time">{timeAgo(ev.id)}</div>
      </div>
    );
  }

  return null;
}

export default function LiveFeed({ events, history }) {
  const allEvents = events.length > 0 ? events : history.map((h, i) => ({ ...h, type: "complete", id: i }));

  if (allEvents.length === 0) {
    return (
      <div className="feed">
        <div className="feed-empty">
          📡 Waiting for tasks... Submit one above or press ▶️ Auto Demo!
        </div>
      </div>
    );
  }

  return (
    <div className="feed">
      {allEvents.map((ev) => <FeedRow key={ev.id} ev={ev} />)}
    </div>
  );
}
