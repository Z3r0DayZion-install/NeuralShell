const { execSync } = require('child_process');
const fs = require('fs');

const TOKEN_FILE = 'state/ipc_v3.token';
let token = '';
try {
    token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    console.log(`[AUDIT] Discovered token: ${token}`);
} catch (e) {
    console.error("[AUDIT] Failed to discover token via FS.");
}

const PIPE_PATH = token ? `\\\\.\\pipe\\neurallink-${token}` : `\\\\.\\pipe\\neurallink`;

console.log(`\n--- ADV-01: Probing Static Pipe (No Token) ---`);
try {
    execSync('neural-link.exe --token "" ping');
    console.error("FAIL: Static pipe probe succeeded!");
} catch (e) {
    console.log("PASS: Static pipe probe failed (Access Denied / Not Found).");
}

console.log(`\n--- ADV-03: Jitter Profiling (10 samples) ---`);
const latencies = [];
for (let i = 0; i < 10; i++) {
    const start = Date.now();
    try {
        const output = execSync(`neural-link.exe --token "${token}" ping`, { stdio: ['ignore', 'pipe', 'pipe'] });
        const duration = Date.now() - start;
        latencies.push(duration);
        console.log(`Sample ${i + 1}: ${duration}ms [${output.toString().trim()}]`);
    } catch (e) {
        console.error(`Sample ${i + 1}: FAILED`);
        console.error(`Error: ${e.stderr ? e.stderr.toString().trim() : e.message}`);
    }
}

const min = Math.min(...latencies);
const max = Math.max(...latencies);
const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
const variance = max - min;

console.log(`\nJitter Metrics:`);
console.log(`Min: ${min}ms`);
console.log(`Max: ${max}ms`);
console.log(`Avg: ${avg.toFixed(2)}ms`);
console.log(`Variance: ${variance}ms`);

if (variance > 30) {
    console.log("RESULT: Jitter Defense is ACTIVE (High Variance).");
} else {
    console.log("RESULT: Jitter Defense may be WEAK (Low Variance).");
}
