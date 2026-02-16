"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("node:child_process");

test("Electron auth recovery UI flow succeeds in recovery smoke mode", async () => {
  const electronPath = require("electron");
  const appDir = path.resolve(__dirname, "..");

  await new Promise((resolve, reject) => {
    const userDataDir = path.join(os.tmpdir(), `neuralshell_e2e_recovery_${Date.now()}`);
    fs.mkdirSync(userDataDir, { recursive: true });
    const child = spawn(electronPath, [appDir], {
      env: { ...process.env, NS_E2E_RECOVERY_SMOKE: "1", NS_USER_DATA_DIR: userDataDir },
      windowsHide: true
    });

    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error("Recovery smoke launch timed out"));
    }, 20000);

    child.stderr.on("data", (d) => {
      stderr += String(d);
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      assert.equal(code, 0, `Unexpected exit code ${code}\n${stderr}`);
      resolve();
    });
  });
});
