"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { spawn } = require("node:child_process");

test("Electron app launches and exits in smoke mode", async () => {
  const electronPath = require("electron");
  const appDir = path.resolve(__dirname, "..");

  await new Promise((resolve, reject) => {
    const child = spawn(electronPath, [appDir], {
      env: { ...process.env, NS_E2E_SMOKE: "1" },
      windowsHide: true
    });

    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error("Smoke launch timed out"));
    }, 15000);

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
