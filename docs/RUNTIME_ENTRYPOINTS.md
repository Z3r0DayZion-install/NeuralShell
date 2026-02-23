# NeuralShell runtime entrypoints (HTTP listeners + metrics)

## Production server (full runtime)

- Entrypoint: `production-server.js` (package.json `start`: `node production-server.js`)
- Listener start: `NeuralShellServer.start()` calls `this.app.listen({ port, host })` in `production-server.js`
- Port/host selection:
  - `server.port` from YAML config (`CONFIG_PATH`, default `./config.yaml`), else `PORT`, else `3000`
  - `server.host` from YAML config, else `0.0.0.0`
  - Supports `server.port: 0` (ephemeral) for runtime proof/testing
- Listener log (stdout): `Server listening at http://127.0.0.1:<port>`
- Metrics:
  - `GET /metrics` → Prometheus text (`text/plain`), includes:
    - `neuralshell_uptime_seconds`
    - `neuralshell_requests_total`
    - `neuralshell_failures_total`
  - `GET /metrics/prometheus` → Prometheus text (base metrics + exporter metrics)
  - `GET /metrics/json` → JSON metrics (router/core), intended for programmatic clients

## Router server (standalone router runtime)

- Entrypoint: `router.js` (exports `startServer()` which calls `fastify.listen(...)`)
- Port/host selection:
  - `PORT = Number(process.env.PORT || 3000)`
  - Listens on `0.0.0.0`
- Metrics:
  - `GET /metrics` → Prometheus text (`text/plain; version=0.0.4`)
  - `GET /metrics/prometheus` → Prometheus text (`text/plain; version=0.0.4`)
  - `GET /metrics/json` → JSON metrics (includes route counts, endpoint stats, latency summary)

## Desktop renderer network hardening (Electron)

- `NeuralShell_Desktop/main.js` sets `webSecurity: true`, `contextIsolation: true`, `nodeIntegration: false`
- CSP disallows outbound network from renderer (`connect-src 'none'`)

