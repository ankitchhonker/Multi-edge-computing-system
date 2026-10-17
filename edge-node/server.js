// One edge node. Start three of these on three ports to simulate three edge nodes.
// Example:
//   node server.js EdgeA 5000 10 2
//   node server.js EdgeB 5001 20 2
//   node server.js EdgeC 5002 15 2
// args: NAME  PORT  SIMULATED_NETWORK_DELAY_MS  MAX_PARALLEL_WORKERS

const express = require("express");
const path = require("path");
const os = require("os");
const { Worker } = require("worker_threads");

const [, , NAME = "EdgeA", PORT = 5000, DELAY = 10, MAX_WORKERS = 2] = process.argv;
const port = Number(PORT);
const baseDelay = Number(DELAY);
const maxWorkers = Number(MAX_WORKERS);

// FCFS (first come first served) or SJF (shortest job first)
// set with:  SCHED=SJF node server.js EdgeA 5000 10 2
const SCHED = process.env.SCHED || "FCFS";

const app = express();
app.use(express.json());

// ---- mini OS scheduler -------------------------------------------------------
let activeWorkers = 0;
const queue = [];
// Track active task progress so /status can report it live
const activeTasks = new Map(); // id -> { taskType, size, progress, startedAt }

function enqueue(task) {
  queue.push(task);
  if (SCHED === "SJF") {
    queue.sort((a, b) => a.size - b.size); // smallest job runs first
  }
  drain();
}

// Give work to free workers up to the concurrency limit (semaphore pattern)
function drain() {
  while (activeWorkers < maxWorkers && queue.length > 0) {
    const task = queue.shift();
    runOnWorker(task);
  }
}

function runOnWorker(task) {
  activeWorkers++;
  task.startedAt = Date.now();

  activeTasks.set(task.id, {
    taskType: task.taskType || "prime",
    size: task.size,
    progress: 0,
    startedAt: task.startedAt,
  });

  const worker = new Worker(path.join(__dirname, "worker.js"), {
    workerData: { size: task.size, taskType: task.taskType || "prime" }
  });

  worker.on("message", (msg) => {
    if (msg.progress !== undefined) {
      // Update progress so /status endpoint can report it
      const t = activeTasks.get(task.id);
      if (t) t.progress = msg.progress;
      return;
    }
    if (msg.done) {
      task.finishedAt = Date.now();
      activeTasks.delete(task.id);
      task.resolve({
        taskId: task.id,
        node: NAME,
        taskType: task.taskType || "prime",
        resultLabel: msg.result?.label || "",
        waitMs: task.startedAt - task.receivedAt,
        runMs: task.finishedAt - task.startedAt,
        primesFound: msg.result?.count ?? 0,
      });
      activeWorkers--;
      drain();
    }
  });

  worker.on("error", (err) => {
    activeTasks.delete(task.id);
    activeWorkers--;
    task.reject(err);
    drain();
  });
}
// ---- end scheduler -----------------------------------------------------------

app.get("/status", (req, res) => {
  res.json({
    name: NAME,
    port,
    delay: baseDelay,
    scheduling: SCHED,
    activeWorkers,
    maxWorkers,
    queueLength: queue.length,
    load: Math.min(100, Math.round(((activeWorkers + queue.length) / maxWorkers) * 50)),
    cpuLoadAvg: Number(os.loadavg()[0].toFixed(2)),
    freeMemMB: Math.round(os.freemem() / 1048576),
    activeTasks: Array.from(activeTasks.values()),
  });
});

app.post("/run", (req, res) => {
  const { id, size = 500000, taskType = "prime", priority = "normal" } = req.body || {};
  const task = { id, size, taskType, priority, receivedAt: Date.now() };

  const done = new Promise((resolve, reject) => {
    task.resolve = resolve;
    task.reject = reject;
  });

  enqueue(task);

  done
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.listen(port, () => {
  console.log(`[${NAME}] edge node up on port ${port} | scheduling=${SCHED} | maxWorkers=${maxWorkers}`);
});
