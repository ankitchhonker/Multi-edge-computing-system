# 🌐 Edge Task Delegation — MERN Mini Project

Real CPU work, real routing decisions, zero fake delays. Every edge node runs actual compute tasks inside **worker threads**. The main server measures **real round-trip delay** with `Date.now()`. Task history is kept in a JSON file (`main-server/task-log.json`).

---

## 🧠 What It Does (Plain English)

When you submit a task, the system:
1. **Pings all 3 edge nodes** — measures real response time (RTT)
2. **Scores each node** — `score = RTT + load` (lower = better)
3. **Picks the winner** — sends the task to the lowest-score node
4. **Handles failures** — if a node crashes mid-task, retries on another
5. **Falls back to Cloud** — if all nodes are down or overloaded

The dashboard shows all of this **live**, as it happens.

---

## 📁 Project Structure

| Folder | Tech | Role |
|---|---|---|
| `edge-node/` | Node.js + Express + worker_threads | Simulates one edge server. Run 3 copies on 3 ports. |
| `main-server/` | Node.js + Express | Picks the best edge node, retries failures, falls back to cloud. |
| `dashboard/` | React (Vite) + Recharts | Live presentation dashboard with charts, architecture diagram, and demo controls. |

---

## 🖥️ 5 Task Types

| Type | What it computes | Audience understands it as |
|---|---|---|
| 🔢 **Prime Scan** | Count primes up to N | Heavy math calculation |
| 🎲 **Monte Carlo π** | Estimate π by throwing random darts | Statistical sampling |
| 🔐 **Hash Chain** | SHA-256 hash 100K+ times | Password-hashing workload |
| 📊 **Matrix Multiply** | Multiply two large matrices | Core of AI & graphics |
| 🗄️ **Data Compress** | Run-length encode a buffer | Like ZIP compression |

All tasks report **live progress** (0–100%) back to the dashboard.

---

## ⚙️ 1. Install Dependencies

```bash
cd edge-node   && npm install && cd ..
cd main-server && npm install && cd ..
cd dashboard   && npm install && cd ..
```

---

## 🚀 2. Run It (5 Terminals)

**Terminals 1–3 — Edge Nodes:**
```bash
cd edge-node
node server.js EdgeA 5000 10 2
node server.js EdgeB 5001 20 2
node server.js EdgeC 5002 15 2
```
Args: `name  port  simulated-network-delay-ms  max-parallel-workers`

To use Shortest-Job-First scheduling:
```bash
SCHED=SJF node server.js EdgeA 5000 10 2
```

**Terminal 4 — Main Server:**
```bash
cd main-server
node server.js
```

**Terminal 5 — Dashboard:**
```bash
cd dashboard
npm run dev
```
Open **http://localhost:5173**

---

## 🎮 3. Presentation Demo Guide

### Live Demo Flow (recommended order)

1. **Show the architecture diagram** — explain the routing concept visually
2. **Submit a Small task** — show which node was chosen and why (score)
3. **Submit a Large task** — watch the progress bar fill live
4. **Try different task types** — Monte Carlo π, Matrix Multiply, etc.
5. **Click "Kill for Demo"** on a node — submit again, watch retry logic
6. **Kill all 3 nodes** — submit again, watch cloud fallback trigger
7. **Press ▶ Auto Demo** — sit back, tasks auto-submit every 3.5 seconds
8. **Revive the nodes** — watch the system recover automatically

### Demo Controls (in the dashboard)...    

| Button | What it does |
|---|---|
| **▶ Auto Demo** | Auto-submits random tasks every 3.5 seconds |
| **Kill for Demo** | Tells the main server to skip this node |
| **Revive Node** | Brings the node back into rotation |

---

## 🔌 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | GET | All node statuses (RTT, load, active tasks, progress) |
| `/api/submit-task` | POST | Submit a task `{ size, taskType, urgent }` |
| `/api/history` | GET | Last 20 completed tasks |
| `/api/analytics` | GET | Per-node avg wait/run times |
| `/api/events` | GET (SSE) | Real-time event stream (task_complete, task_retry, etc.) |
| `/api/disable/:name` | POST | Disable a node for demo purposes |
| `/api/enable/:name` | POST | Re-enable a disabled node |

---

## 💡 5. Key Concepts (Viva Talking Points)

- **Real work, not fake delays** — `worker.js` runs actual CPU algorithms; time is measured with `Date.now()`
- **Score-based selection** — `score = RTT + load`; the server that responds fastest *and* is least busy wins
- **OS-level concurrency** — worker threads (real OS threads), a semaphore (concurrency limit), and a ready queue (FCFS or SJF)
- **Fault tolerance** — node down → retry on another; all nodes busy → cloud fallback
- **Live progress** — workers post progress messages every 5%, dashboard shows a live progress bar
- **SSE (Server-Sent Events)** — instead of polling, the dashboard subscribes to a real-time event stream

---

## 🗂️ Task Log

Every completed task is saved to `main-server/task-log.json`:
```json
{
  "taskId": "lx1a2b",
  "taskType": "monte-carlo",
  "chosenNode": "EdgeA",
  "score": 32,
  "usedCloud": false,
  "waitMs": 5,
  "runMs": 412,
  "resultLabel": "π ≈ 3.141593 (500,000 darts)"
}
```
