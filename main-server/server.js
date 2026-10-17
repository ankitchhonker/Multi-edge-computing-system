const express = require("express");
const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const NODES = require("./nodes");

const app = express();
app.use(express.json());

// CORS for the React dashboard
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST");
  next();
});

const LOG_FILE = path.join(__dirname, "task-log.json");
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");

const pending = {};          // tasks sent to a node but not yet replied
const disabledNodes = new Set(); // nodes manually disabled via demo button
const MAX_LOAD = 80;
const MAX_RETRIES = 2;

// ── Server-Sent Events broadcast ─────────────────────────────────────────────
const sseClients = new Set();

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(msg); } catch { sseClients.delete(client); }
  }
}

// ── Node selection logic ──────────────────────────────────────────────────────
async function getNodeStatus(node) {
  const start = Date.now();
  try {
    const res = await fetch(`${node.url}/status`, { signal: AbortSignal.timeout(1000) });
    const data = await res.json();
    const rtt = Date.now() - start;
    return { ...data, url: node.url, rtt, disabled: disabledNodes.has(node.name) };
  } catch {
    return null; // node is down or too slow
  }
}

function scoreNode(n, task) {
  const extraLoad = (pending[n.name] || 0) * 10;
  const load = n.load + extraLoad;
  const delay = task.urgent ? n.rtt * 2 : n.rtt; // urgent tasks weight delay more
  return { ...n, load, score: delay + load };
}

async function pickBestNode(task, skip = []) {
  const statuses = await Promise.all(
    NODES
      .filter((n) => !skip.includes(n.name) && !disabledNodes.has(n.name))
      .map(getNodeStatus)
  );
  const healthy = statuses.filter(Boolean).filter((n) => n.load < MAX_LOAD && !n.disabled);
  if (healthy.length === 0) return null;
  const scored = healthy.map((n) => scoreNode(n, task));
  scored.sort((a, b) => a.score - b.score);
  return scored[0];
}

function logTask(entry) {
  const log = JSON.parse(fs.readFileSync(LOG_FILE));
  log.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// Cloud fallback — runs locally in a worker thread; never refuses a task
async function runOnCloud(task) {
  const start = Date.now();
  const result = await new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "..", "edge-node", "worker.js"), {
      workerData: { size: task.size, taskType: task.taskType || "prime" }
    });
    worker.on("message", (m) => { if (m.done) resolve(m.result); });
    worker.on("error", reject);
  });
  return {
    node: "CLOUD",
    waitMs: 200,
    runMs: Date.now() - start,
    primesFound: result?.count ?? 0,
    resultLabel: result?.label || "",
    taskType: task.taskType || "prime"
  };
}

// ── API routes ────────────────────────────────────────────────────────────────

app.get("/api/status", async (req, res) => {
  const statuses = await Promise.all(NODES.map(getNodeStatus));
  res.json(
    statuses.map((s, i) =>
      s
        ? { ...s, disabled: disabledNodes.has(NODES[i].name) }
        : { name: NODES[i].name, down: true, disabled: disabledNodes.has(NODES[i].name) }
    )
  );
});

app.post("/api/submit-task", async (req, res) => {
  const task = {
    size: 500000,
    urgent: false,
    taskType: "prime",
    ...req.body,
    id: Date.now().toString(36),
  };
  const skip = [];
  let result = null;
  let chosen = null;
  let attempts = 0;

  // Broadcast that a new task has been received
  broadcast("task_started", {
    taskId: task.id,
    size: task.size,
    taskType: task.taskType,
    urgent: task.urgent,
    time: new Date().toISOString(),
  });

  while (attempts < MAX_RETRIES && !result) {
    attempts++;
    chosen = await pickBestNode(task, skip);
    if (!chosen) break;

    pending[chosen.name] = (pending[chosen.name] || 0) + 1;
    try {
      const r = await fetch(`${chosen.url}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
        signal: AbortSignal.timeout(30000)
      });
      result = await r.json();
    } catch {
      // Node failed mid-task; broadcast retry event and try another
      broadcast("task_retry", { taskId: task.id, failedNode: chosen.name, attempt: attempts });
      skip.push(chosen.name);
    } finally {
      pending[chosen.name]--;
    }
  }

  let usedCloud = false;
  if (!result) {
    broadcast("cloud_fallback", { taskId: task.id, reason: "All nodes failed or overloaded" });
    result = await runOnCloud(task);
    usedCloud = true;
  }

  const entry = {
    taskId: task.id,
    size: task.size,
    taskType: task.taskType || "prime",
    urgent: task.urgent,
    chosenNode: result.node,
    resultLabel: result.resultLabel || "",
    score: chosen ? Math.round(chosen.score) : null,
    usedCloud,
    attempts,
    waitMs: result.waitMs,
    runMs: result.runMs,
    time: new Date().toISOString(),
  };

  logTask(entry);
  broadcast("task_complete", entry);
  res.json(entry);
});

app.get("/api/history", (req, res) => {
  const log = JSON.parse(fs.readFileSync(LOG_FILE));
  res.json(log.slice(-20).reverse());
});

app.get("/api/analytics", (req, res) => {
  const log = JSON.parse(fs.readFileSync(LOG_FILE));
  const byNode = {};
  for (const t of log) {
    byNode[t.chosenNode] = byNode[t.chosenNode] || { count: 0, totalWait: 0, totalRun: 0 };
    byNode[t.chosenNode].count++;
    byNode[t.chosenNode].totalWait += t.waitMs;
    byNode[t.chosenNode].totalRun += t.runMs;
  }
  const summary = Object.entries(byNode).map(([node, s]) => ({
    node,
    tasks: s.count,
    avgWaitMs: Math.round(s.totalWait / s.count),
    avgRunMs: Math.round(s.totalRun / s.count),
  }));
  res.json(summary);
});

// SSE endpoint — dashboard subscribes here to get real-time task events
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write("event: connected\ndata: {}\n\n");
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

// Demo controls — disable / re-enable a node (simulates node going offline)
app.post("/api/disable/:name", (req, res) => {
  disabledNodes.add(req.params.name);
  broadcast("node_disabled", { name: req.params.name, time: new Date().toISOString() });
  res.json({ ok: true, disabled: req.params.name });
});

app.post("/api/enable/:name", (req, res) => {
  disabledNodes.delete(req.params.name);
  broadcast("node_enabled", { name: req.params.name, time: new Date().toISOString() });
  res.json({ ok: true, enabled: req.params.name });
});

app.listen(4000, () => console.log("main server: http://localhost:4000"));
