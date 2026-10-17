// This file runs INSIDE a separate worker thread (a real OS thread), not the main thread.
// Supports 5 task types: prime, monte-carlo, hash-chain, matrix, compress
// Sends progress updates every ~5% so the dashboard can show a live progress bar.
const { parentPort, workerData } = require("worker_threads");
const crypto = require("crypto");

const { size = 500000, taskType = "prime" } = workerData;

function sendProgress(pct) {
  parentPort.postMessage({ progress: Math.min(100, Math.max(0, Math.round(pct))) });
}

// ── Task 1: Count prime numbers (original) ───────────────────────────────────
function countPrimes(n) {
  let count = 0;
  const step = Math.max(1, Math.floor(n / 20));
  for (let i = 2; i <= n; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) { isPrime = false; break; }
    }
    if (isPrime) count++;
    if (i % step === 0) sendProgress((i / n) * 100);
  }
  return { count, label: `${count} primes found up to ${n.toLocaleString()}` };
}

// ── Task 2: Monte Carlo Pi estimation ────────────────────────────────────────
// Throw random darts at a unit square; fraction inside quarter-circle → π
function monteCarloPi(samples) {
  let inside = 0;
  const step = Math.max(1, Math.floor(samples / 20));
  for (let i = 0; i < samples; i++) {
    const x = Math.random();
    const y = Math.random();
    if (x * x + y * y <= 1) inside++;
    if (i % step === 0) sendProgress((i / samples) * 100);
  }
  const pi = (4 * inside) / samples;
  return { count: inside, label: `π ≈ ${pi.toFixed(6)} (${samples.toLocaleString()} darts)` };
}

// ── Task 3: SHA-256 hash chain ────────────────────────────────────────────────
// Simulates password-hashing workload (intentionally CPU-intensive)
function hashChain(iterations) {
  let hash = "edge-computing-demo-2024";
  const step = Math.max(1, Math.floor(iterations / 20));
  for (let i = 0; i < iterations; i++) {
    hash = crypto.createHash("sha256").update(hash + i).digest("hex");
    if (i % step === 0) sendProgress((i / iterations) * 100);
  }
  return { count: iterations, label: `${iterations.toLocaleString()} SHA-256 hashes chained` };
}

// ── Task 4: Matrix multiplication ─────────────────────────────────────────────
// Core operation behind AI/image rendering
function matrixMultiply(dim) {
  const rand = () => Math.random();
  const A = Array.from({ length: dim }, () => Array.from({ length: dim }, rand));
  const B = Array.from({ length: dim }, () => Array.from({ length: dim }, rand));
  const C = Array.from({ length: dim }, () => new Array(dim).fill(0));
  for (let i = 0; i < dim; i++) {
    sendProgress((i / dim) * 100);
    for (let j = 0; j < dim; j++) {
      for (let k = 0; k < dim; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  const ops = dim * dim * dim;
  return { count: ops, label: `${dim}×${dim} matrix multiplied (${ops.toLocaleString()} ops)` };
}

// ── Task 5: Run-length encoding (data compression simulation) ────────────────
// Like ZIP compression — finds repeated byte sequences and encodes them compactly
function compressData(byteCount) {
  // Generate semi-compressible data
  const data = new Uint8Array(byteCount);
  let v = 0;
  for (let i = 0; i < byteCount; i++) {
    if (Math.random() < 0.25) v = Math.floor(Math.random() * 256);
    data[i] = v;
  }
  // RLE encode
  let compressed = 0;
  const step = Math.max(1, Math.floor(byteCount / 20));
  let i = 0;
  while (i < data.length) {
    let run = 1;
    while (i + run < data.length && data[i + run] === data[i] && run < 255) run++;
    compressed += 2; // store (value, count)
    i += run;
    if (i % step < run) sendProgress((i / byteCount) * 100);
  }
  const ratio = Math.round((1 - compressed / byteCount) * 100);
  return { count: compressed, label: `${(byteCount / 1024).toFixed(1)} KB compressed by ~${ratio}%` };
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
let result;
try {
  switch (taskType) {
    case "monte-carlo":
      result = monteCarloPi(size);
      break;
    case "hash-chain":
      result = hashChain(Math.max(1000, Math.floor(size / 5)));
      break;
    case "matrix": {
      const dim = Math.min(220, Math.max(40, Math.floor(Math.cbrt(size / 2))));
      result = matrixMultiply(dim);
      break;
    }
    case "compress":
      result = compressData(Math.max(10000, size));
      break;
    default: // "prime"
      result = countPrimes(size);
  }
} catch (err) {
  result = { count: 0, label: "Error: " + err.message };
}

sendProgress(100);
parentPort.postMessage({ done: true, result });
