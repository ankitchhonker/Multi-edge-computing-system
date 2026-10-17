import React, { useEffect, useState, useRef, useCallback } from "react";
import HeroBanner from "./components/HeroBanner";
import ArchDiagram from "./components/ArchDiagram";
import NodeCard from "./components/NodeCard";
import TaskSubmit from "./components/TaskSubmit";
import LiveFeed from "./components/LiveFeed";
import Analytics from "./components/Analytics";
import "./App.css";

const API = "http://localhost:4000";

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeNode, setActiveNode] = useState(null); // node currently receiving a task
  const [toast, setToast] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const demoRef = useRef(null);
  const rttHistory = useRef({}); // { nodeName: [rtt, rtt, ...] (last 20) }

  // ── Polling: node status + history + analytics every 2s ────────────────
  const refresh = useCallback(async () => {
    try {
      const [s, h, a] = await Promise.all([
        fetch(`${API}/api/status`).then((r) => r.json()),
        fetch(`${API}/api/history`).then((r) => r.json()),
        fetch(`${API}/api/analytics`).then((r) => r.json()),
      ]);
      setNodes(s);
      setHistory(h);
      setAnalytics(a);
      // Track RTT history per node
      s.forEach((n) => {
        if (!n.down && n.rtt !== undefined) {
          if (!rttHistory.current[n.name]) rttHistory.current[n.name] = [];
          rttHistory.current[n.name].push(n.rtt);
          if (rttHistory.current[n.name].length > 20)
            rttHistory.current[n.name].shift();
        }
      });
    } catch (e) {
      console.error("Cannot reach main server on port 4000", e);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── SSE: live task events ────────────────────────────────────────
  useEffect(() => {
    let es;
    function connect() {
      es = new EventSource(`${API}/api/events`);
      const addEvent = (type, data) => {
        setEvents((prev) => [{ type, ...data, id: Date.now() + Math.random() }, ...prev].slice(0, 50));
      };
      es.addEventListener("task_started", (e) => addEvent("started", JSON.parse(e.data)));
      es.addEventListener("task_complete", (e) => {
        const d = JSON.parse(e.data);
        addEvent("complete", d);
        setActiveNode(d.chosenNode);
        showToast(d);
        setTimeout(() => setActiveNode(null), 2000);
        refresh();
      });
      es.addEventListener("task_retry", (e) => addEvent("retry", JSON.parse(e.data)));
      es.addEventListener("cloud_fallback", (e) => addEvent("cloud", JSON.parse(e.data)));
      es.addEventListener("node_disabled", (e) => addEvent("disabled", JSON.parse(e.data)));
      es.addEventListener("node_enabled", (e) => addEvent("enabled", JSON.parse(e.data)));
      es.onerror = () => { es.close(); setTimeout(connect, 3000); };
    }
    connect();
    return () => es && es.close();
  }, []);

  // ── Toast notification ───────────────────────────────────────────
  const showToast = (task) => {
    const msg = task.usedCloud
      ? `☁️ Cloud fallback used — all nodes were busy`
      : `✅ Sent to ${task.chosenNode} (score: ${task.score}) — done in ${task.runMs}ms`;
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Task submission ─────────────────────────────────────────────
  const submitTask = useCallback(async (params) => {
    try {
      await fetch(`${API}/api/submit-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    } catch (e) {
      console.error("Submit failed", e);
    }
  }, []);

  // ── Demo mode: auto-submit random tasks every 3s ──────────────────────
  useEffect(() => {
    const taskTypes = ["prime", "monte-carlo", "hash-chain", "matrix", "compress"];
    const sizes = [100000, 500000, 2000000];
    if (demoMode) {
      demoRef.current = setInterval(() => {
        submitTask({
          size: sizes[Math.floor(Math.random() * sizes.length)],
          taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
          urgent: Math.random() < 0.2,
        });
      }, 3500);
    } else {
      clearInterval(demoRef.current);
    }
    return () => clearInterval(demoRef.current);
  }, [demoMode, submitTask]);

  // ── Kill / revive node (demo feature) ────────────────────────────
  const toggleNode = useCallback(async (name, currentlyDisabled) => {
    const action = currentlyDisabled ? "enable" : "disable";
    await fetch(`${API}/api/${action}/${name}`, { method: "POST" });
    refresh();
  }, [refresh]);

  const totalTasks = analytics.reduce((s, a) => s + a.tasks, 0);
  const onlineNodes = nodes.filter((n) => !n.down && !n.disabled).length;
  const queuedTasks = nodes.reduce((s, n) => s + (n.queueLength || 0), 0);

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}

      <HeroBanner
        onlineNodes={onlineNodes}
        totalNodes={nodes.length}
        totalTasks={totalTasks}
        queuedTasks={queuedTasks}
        demoMode={demoMode}
        onDemoToggle={() => setDemoMode((d) => !d)}
      />

      <ArchDiagram nodes={nodes} activeNode={activeNode} />

      <section className="section">
        <h2 className="section-title">🖥️ Live Edge Nodes</h2>
        <div className="cards">
          {nodes.map((n) => (
            <NodeCard
              key={n.name}
              node={n}
              rttHistory={rttHistory.current[n.name] || []}
              isActive={activeNode === n.name}
              onToggle={() => toggleNode(n.name, n.disabled)}
            />
          ))}
        </div>
      </section>

      <TaskSubmit onSubmit={submitTask} />

      <section className="section">
        <h2 className="section-title">⚡ Live Task Feed</h2>
        <LiveFeed events={events} history={history} />
      </section>

      <section className="section">
        <h2 className="section-title">📊 Node Analytics</h2>
        <Analytics analytics={analytics} />
      </section>
    </div>
  );
}
