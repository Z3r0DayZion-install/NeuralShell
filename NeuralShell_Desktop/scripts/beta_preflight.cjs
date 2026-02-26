"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

function fail(msg) {
  process.stderr.write(`[beta-preflight] FAIL ${msg}\n`);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function runCapture(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    let out = "";
    let err = "";
    const child = spawn(cmd, args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      cwd: opts?.cwd || process.cwd(),
      env: { ...process.env, ...(opts?.env || {}) }
    });
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve({ stdout: out, stderr: err });
      reject(new Error(`cmd failed code=${code}\n${err}`));
    });
  });
}

function httpReq({ url, method, body, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        method: method || "GET",
        hostname: u.hostname,
        port: Number(u.port),
        path: u.pathname + (u.search || ""),
        timeout: timeoutMs || 1500
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({ status: res.statusCode || 0, headers: res.headers || {}, body: data })
        );
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function waitForPortFree({ port, deadlineMs }) {
  return new Promise((resolve) => {
    const started = Date.now();
    function tryBind() {
      const srv = net.createServer();
      srv.once("error", (err) => {
        if (Date.now() - started > deadlineMs) return resolve({ ok: false, error: String(err && err.code ? err.code : err) });
        setTimeout(tryBind, 75);
      });
      srv.listen(port, "127.0.0.1", () => srv.close(() => resolve({ ok: true })));
    }
    tryBind();
  });
}

function spawnExe({ exePath, env }) {
  const child = spawn(exePath, [], {
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    cwd: path.dirname(exePath),
    env: { ...process.env, ...(env || {}) }
  });
  return { child };
}

function pickEphemeralPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : null;
      srv.close(() => resolve(Number(port)));
    });
  });
}

async function waitForHealth({ startPort, span, deadlineMs }) {
  const started = Date.now();
  while (Date.now() - started <= deadlineMs) {
    let i = 0;
    while (i !== span) {
      const port = startPort + i;
      try {
        const res = await httpReq({ url: `http://127.0.0.1:${port}/health`, timeoutMs: 350 });
        if (res.status === 200) return { port, res };
      } catch {
        // ignore
      }
      i++;
    }
    await new Promise((r) => setTimeout(r, 75));
  }
  return { port: null, res: null };
}

async function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const parentRoot = path.resolve(desktopRoot, "..");
  const rcDir = process.argv.includes("--rc")
    ? path.resolve(process.argv[process.argv.indexOf("--rc") + 1])
    : path.join(desktopRoot, "release", "rc", "latest");

  if (process.env.NODE_OPTIONS && /--inspect|--debug/.test(String(process.env.NODE_OPTIONS))) {
    fail("debug flags detected in NODE_OPTIONS");
  }

  const m = readJson(path.join(rcDir, "RELEASE_MANIFEST.json"));
  if (m.nodeVersion !== process.version) fail(`node version mismatch manifest=${m.nodeVersion} local=${process.version}`);
  const npmWrap =
    process.platform === "win32"
      ? { cmd: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", "npm", "-v"] }
      : { cmd: "npm", args: ["-v"] };
  const npmVer = (await runCapture(npmWrap.cmd, npmWrap.args)).stdout.trim();
  if (m.npmVersion !== npmVer) fail(`npm version mismatch manifest=${m.npmVersion} local=${npmVer}`);

  // Proof-gate enforced in parent npm test
  const parentPkg = readJson(path.join(parentRoot, "package.json"));
  const testScript = String(parentPkg.scripts?.test || "");
  if (testScript.indexOf("proof:all") === -1) fail("parent npm test is not proof-gated");

  // verify:release
  await runCapture(process.execPath, [path.join(desktopRoot, "scripts", "verify_release.cjs"), "--rc", rcDir]);

  const exePath = path.join(rcDir, m.artifacts.exe.file);
  if (!fs.existsSync(exePath)) fail(`missing exe ${exePath}`);

  const runtimeDir = path.join(os.tmpdir(), `neuralshell-beta-preflight-${process.pid}`);
  fs.rmSync(runtimeDir, { recursive: true, force: true });
  fs.mkdirSync(runtimeDir, { recursive: true });

  const desiredPort = await pickEphemeralPort();
  const one = spawnExe({ exePath, env: { NS_RUNTIME_DIR: runtimeDir, NS_TEAR_PORT: String(desiredPort) } });
  let baseUrl = null;
  let port = null;
  let health = null;
  try {
    const found = await waitForHealth({ startPort: desiredPort, span: 25, deadlineMs: 10000 });
    if (!found.port) fail("listen timeout");
    port = found.port;
    baseUrl = `http://127.0.0.1:${port}`;
    health = found.res;
  } catch (e) {
    const taskkill = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "taskkill.exe");
    await runCapture(taskkill, ["/PID", String(one.child.pid), "/T", "/F"]).catch(() => {});
    throw e;
  }

  const mode = String(health.headers["x-neuralshell-license-mode"] || "");
  if (mode !== "restricted") fail(`licensing not enforced (expected restricted) mode=${mode}`);
  const healthObj = JSON.parse(health.body);
  if (!healthObj.crashHandlersRegistered) fail("crashHandlersRegistered missing/false");

  const lic = await httpReq({ url: `${baseUrl}/license/status`, timeoutMs: 1500 });
  assert.equal(lic.status, 200);
  const licObj = JSON.parse(lic.body);
  if (String(licObj.mode) !== "restricted") fail(`license/status mode expected restricted got ${String(licObj.mode)}`);

  const requireRes = await httpReq({ url: `${baseUrl}/license/require`, timeoutMs: 1500 });
  if (requireRes.status !== 403) fail(`restricted license/require expected 403 got ${requireRes.status}`);
  if (requireRes.body.indexOf("license_required") === -1) fail("restricted license/require missing license_required");
  if (requireRes.body.toLowerCase().indexOf("stack") !== -1) fail("stack traces detected in restricted response");

  // Dual-instance lock bite
  let lockedOutput = "";
  const locked = spawn(exePath, [], {
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    cwd: path.dirname(exePath),
    env: { ...process.env, NS_RUNTIME_DIR: runtimeDir }
  });
  locked.stdout.on("data", (d) => (lockedOutput += d.toString("utf8")));
  locked.stderr.on("data", (d) => (lockedOutput += d.toString("utf8")));
  const lockedExit = await new Promise((resolve) => locked.on("exit", (code) => resolve(code ?? 1)));
  if (lockedExit === 0) fail("expected second instance to fail");
  if (lockedOutput.indexOf("INSTANCE_LOCKED") === -1) fail("INSTANCE_LOCKED not observed for second instance");

  // teardown
  const taskkill = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "taskkill.exe");
  await runCapture(taskkill, ["/PID", String(one.child.pid), "/T", "/F"]).catch(() => {});
  const free = await waitForPortFree({ port, deadlineMs: 5000 });
  if (!free.ok) fail(`port not released port=${port}`);
  fs.rmSync(runtimeDir, { recursive: true, force: true });

  process.stdout.write("[beta-preflight] PASS\n");
}

main().catch((err) => fail(String(err && err.message ? err.message : err)));
