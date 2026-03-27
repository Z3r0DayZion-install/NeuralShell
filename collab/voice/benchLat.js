const { WebSocketServer, WebSocket } = require("ws");

const DEFAULT_PORT = Number(process.env.VOICE_BENCH_PORT || 57123);
const PING_COUNT = Number(process.env.VOICE_BENCH_PINGS || 20);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBench(options = {}) {
  const port = Number(options.port || DEFAULT_PORT);
  const pingCount = Number(options.pingCount || PING_COUNT);
  const latencies = [];
  let socketError = null;

  const wss = new WebSocketServer({ host: "127.0.0.1", port });
  wss.on("connection", (socket) => {
    socket.on("message", (raw) => {
      const msg = String(raw || "");
      if (!msg.startsWith("ping:")) return;
      socket.send(msg.replace("ping:", "pong:"));
    });
  });

  await sleep(80);
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);

  await new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  ws.on("error", (err) => {
    socketError = err;
  });

  for (let i = 0; i < pingCount; i += 1) {
    if (socketError) {
      throw socketError;
    }
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const started = performance.now();
    await new Promise((resolve, reject) => {
      const onMessage = (raw) => {
        const text = String(raw || "");
        if (text === `pong:${token}`) {
          cleanup();
          resolve();
        }
      };
      const cleanup = () => {
        clearTimeout(timeoutHandle);
        ws.off("message", onMessage);
      };
      const timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error(`Voice RTT timeout waiting for token ${token}`));
      }, 3000);
      ws.on("message", onMessage);
      if (socketError) {
        cleanup();
        reject(socketError);
        return;
      }
      ws.send(`ping:${token}`);
    });
    const elapsed = performance.now() - started;
    latencies.push(elapsed);
    await sleep(10);
  }

  ws.close();
  wss.close();

  const result = {
    ok: true,
    transport: "websocket-loopback",
    pingCount,
    medianRttMs: Number(median(latencies).toFixed(2)),
    maxRttMs: Number(Math.max(...latencies).toFixed(2)),
    minRttMs: Number(Math.min(...latencies).toFixed(2)),
    samples: latencies.map((value) => Number(value.toFixed(2)))
  };
  return result;
}

if (require.main === module) {
  runBench()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (result.medianRttMs >= 200) {
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      process.stderr.write(`[voice-bench] ${err && err.message ? err.message : String(err)}\n`);
      process.exitCode = 1;
    });
}

module.exports = {
  runBench
};
