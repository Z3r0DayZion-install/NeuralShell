"use strict";

const { createTearServer } = require("./src/runtime/createTearServer");

function argValue(name, fallback = "") {
  const args = process.argv.slice(2);
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
}

async function main() {
  const host = argValue("--host", process.env.NS_TEAR_HOST || "127.0.0.1");
  const port = Number(argValue("--port", process.env.NS_TEAR_PORT || "4173"));
  const runtimeDir = argValue("--runtime-dir", process.env.NS_RUNTIME_DIR || "");
  const llmHost = argValue("--llm-host", process.env.NS_LLM_HOST || "");

  const { server, runtimeDir: resolvedDir } = await createTearServer({ runtimeDir, llmHost });
  const proofMode = process.env.NODE_ENV === "test" || process.env.PROOF_MODE === "1";
  try {
    await server.listen({ host, port });
  } catch (err) {
    const code = err && typeof err === "object" ? err.code : null;
    if (proofMode && code === "EADDRINUSE" && Number.isFinite(port) && port > 0) {
      try {
        server.log.warn(`Port collision on ${port}; retrying with ephemeral port`);
      } catch {
        // ignore
      }
      await server.listen({ host, port: 0 });
    } else {
      throw err;
    }
  }
  const addr = server.server && typeof server.server.address === "function" ? server.server.address() : null;
  const actualPort = addr && typeof addr === "object" && addr.port ? addr.port : port;
  server.log.info(`NeuralShell TEAR runtime listening on http://${host}:${actualPort}`);
  server.log.info(`Runtime dir: ${resolvedDir}`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
