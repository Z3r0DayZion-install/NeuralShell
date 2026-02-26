"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function fail(msg) {
  process.stderr.write(`[license-smoke] FAIL ${msg}\n`);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function canonicalPayload({ tier, expiresAt, subject }) {
  const t = String(tier || "");
  const ms = Date.parse(String(expiresAt || ""));
  const e = Number.isFinite(ms) ? new Date(ms).toISOString() : "";
  const s = String(subject || "");
  return `tier=${t}\nexpiresAt=${e}\nsubject=${s}\n`;
}

function hmac(secret, payload) {
  return crypto.createHmac("sha256", String(secret)).update(String(payload), "utf8").digest("hex");
}

function httpGet(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      { method: "GET", hostname: u.hostname, port: Number(u.port), path: u.pathname, timeout: timeoutMs || 1500 },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers || {}, body: data }));
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

function pickPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(Number(port)));
    });
  });
}

async function waitForLicenseStatus({ desiredPort, deadlineMs }) {
  const started = Date.now();
  while (Date.now() - started <= deadlineMs) {
    let i = 0;
    while (i !== 30) {
      const port = desiredPort + i;
      try {
        const res = await httpGet(`http://127.0.0.1:${port}/license/status`, 350);
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

async function taskkillTree(pid) {
  const taskkill = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "taskkill.exe");
  try {
    spawn(taskkill, ["/PID", String(pid), "/T", "/F"], { shell: false, windowsHide: true, stdio: "ignore" });
  } catch {
    // ignore
  }
}

async function waitForExit(child, deadlineMs) {
  const started = Date.now();
  while (Date.now() - started <= deadlineMs) {
    const exit = child.exitCode;
    if (exit !== null && exit !== undefined) return exit;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

function getCase() {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--case");
  if (idx !== -1 && argv[idx + 1]) return String(argv[idx + 1]);
  return argv[0] ? String(argv[0]) : "";
}

function resolveRcDir() {
  const desktopRoot = path.resolve(__dirname, "..");
  const idx = process.argv.indexOf("--rc");
  if (idx !== -1 && process.argv[idx + 1]) return path.resolve(process.argv[idx + 1]);
  return path.join(desktopRoot, "release", "rc", "latest");
}

function expectedFor(caseName) {
  if (caseName === "full") return { mode: "full", status: "valid" };
  if (caseName === "missing") return { mode: "restricted", status: "missing" };
  if (caseName === "expired") return { mode: "restricted", status: "expired" };
  if (caseName === "tampered") return { mode: "restricted", status: "invalid_signature", reason: "bad-signature" };
  fail(`unknown case=${caseName}`);
}

async function withLicenseMutation({ rcDir, caseName }, fn) {
  const licensePath = path.join(rcDir, "license.json");
  const backupPath = path.join(rcDir, `license.json.bak-${process.pid}`);
  const hadLicense = fs.existsSync(licensePath);
  if (hadLicense) fs.renameSync(licensePath, backupPath);

  let created = false;
  try {
    if (caseName === "missing") {
      // no-op; license absent
    } else {
      const secret = process.env.LICENSE_HMAC_SECRET;
      if (!secret) fail("missing env LICENSE_HMAC_SECRET");

      const tier = "beta";
      const subject = `license_smoke_${caseName}`;
      const expiresAt =
        caseName === "expired"
          ? new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      const payload = canonicalPayload({ tier, expiresAt, subject });
      const sig = hmac(secret, payload);
      const license = { tier, expiresAt: new Date(Date.parse(expiresAt)).toISOString(), subject, sig };

      if (caseName === "tampered") {
        // create valid, then tamper one field without updating sig
        writeJson(licensePath, license);
        const tampered = readJson(licensePath);
        tampered.tier = "beta-tampered";
        writeJson(licensePath, tampered);
        created = true;
      } else {
        writeJson(licensePath, license);
        created = true;
      }
    }
    return await fn();
  } finally {
    try {
      if (created && fs.existsSync(licensePath)) fs.rmSync(licensePath, { force: true });
    } catch {
      // ignore
    }
    try {
      if (fs.existsSync(backupPath)) fs.renameSync(backupPath, licensePath);
    } catch {
      // ignore
    }
  }
}

async function main() {
  const caseName = getCase();
  const exp = expectedFor(caseName);

  const rcDir = resolveRcDir();
  const exePath = path.join(rcDir, "NeuralShell-TEAR-Runtime.exe");
  if (!fs.existsSync(exePath)) fail(`missing exe ${exePath}`);

  await withLicenseMutation({ rcDir, caseName }, async () => {
    const runtimeDir = path.join(os.tmpdir(), `neuralshell-license-smoke-${caseName}-${process.pid}`);
    fs.rmSync(runtimeDir, { recursive: true, force: true });
    fs.mkdirSync(runtimeDir, { recursive: true });

    const desiredPort = await pickPort();
    const child = spawn(exePath, [], {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore"],
      cwd: rcDir,
      env: { ...process.env, NS_RUNTIME_DIR: runtimeDir, NS_TEAR_PORT: String(desiredPort) }
    });

    try {
      const found = await waitForLicenseStatus({ desiredPort, deadlineMs: 10000 });
      if (!found.port) fail("timeout waiting for /license/status");

      const modeHdr = String(found.res.headers["x-neuralshell-license-mode"] || "");
      assert.equal(modeHdr, exp.mode, `mode header mismatch expected=${exp.mode} got=${modeHdr}`);

      const body = JSON.parse(found.res.body);
      assert.equal(body.ok, true, "body.ok must be true");
      assert.equal(Boolean(body.enforced), true, "body.enforced must be true");
      assert.equal(String(body.mode), exp.mode, `body.mode mismatch expected=${exp.mode} got=${String(body.mode)}`);
      assert.equal(String(body.status), exp.status, `body.status mismatch expected=${exp.status} got=${String(body.status)}`);
      if (exp.reason) {
        assert.equal(String(body.reason), exp.reason, `body.reason mismatch expected=${exp.reason} got=${String(body.reason)}`);
      }

      process.stdout.write(`[license-smoke] PASS mode=${exp.mode} status=${exp.status}\n`);
    } finally {
      await taskkillTree(child.pid);
      const exit = await waitForExit(child, 5000);
      if (exit === null) fail("exe did not exit after taskkill");
      try {
        fs.rmSync(runtimeDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));

