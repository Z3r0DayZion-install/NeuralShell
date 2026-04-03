const crypto = require("crypto");
const { spawn } = require("node:child_process");

function getDaemonJwtSecret(candidateSecret = "") {
  const candidate = String(candidateSecret || "").trim();
  if (candidate) return candidate;
  const envSource = process["env"] || {};
  const envSecret = String(envSource.NS_DAEMON_JWT_SECRET || "").trim();
  if (envSecret) return envSecret;
  return crypto.randomBytes(32).toString("hex");
}

function runProofBundle(workspacePath, send) {
  return new Promise((resolve) => {
    const started = Date.now();
    const safeCwd = workspacePath && String(workspacePath).trim() ? String(workspacePath).trim() : process.cwd();
    const proc = spawn("npm", ["run", "proof:bundle"], {
      cwd: safeCwd,
      shell: true
    });
    let stdout = "";
    let stderr = "";
    const safeSend = typeof send === "function" ? send : () => {};

    proc.stdout.on("data", (chunk) => {
      const text = String(chunk || "");
      stdout += text;
      safeSend({
        action: "proof.log",
        stream: "stdout",
        line: text
      });
    });
    proc.stderr.on("data", (chunk) => {
      const text = String(chunk || "");
      stderr += text;
      safeSend({
        action: "proof.log",
        stream: "stderr",
        line: text
      });
    });

    proc.on("close", (code) => {
      resolve({
        ok: Number(code || 0) === 0,
        exitCode: Number(code || 0),
        durationMs: Date.now() - started,
        stdout,
        stderr
      });
    });
  });
}

function runGitSha(workspacePath) {
  return new Promise((resolve) => {
    const proc = spawn("git", ["rev-parse", "HEAD"], {
      cwd: workspacePath,
      shell: true
    });
    let out = "";
    proc.stdout.on("data", (chunk) => {
      out += String(chunk || "");
    });
    proc.on("close", (code) => {
      if (Number(code || 0) !== 0) {
        resolve("");
        return;
      }
      resolve(String(out || "").trim());
    });
  });
}

module.exports = {
  getDaemonJwtSecret,
  runProofBundle,
  runGitSha
};
