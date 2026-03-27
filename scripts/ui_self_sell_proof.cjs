const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PACKAGED_EXE = path.join(ROOT, "dist", "win-unpacked", "NeuralShell.exe");
const argv = new Set(process.argv.slice(2));
const MODE = argv.has("--packaged") ? "packaged" : "runtime";
const ARTIFACT_SUFFIX = MODE === "packaged" ? "_packaged" : "";
const SCREENSHOT_DIR = path.join(ROOT, "screenshots");
const REPORT_PATH = path.join(
  ROOT,
  "release",
  MODE === "packaged"
    ? "ui-self-sell-proof-report-packaged.json"
    : "ui-self-sell-proof-report.json"
);
const SHOTS = {
  quickstart: path.join(SCREENSHOT_DIR, `ui_sales_quickstart${ARTIFACT_SUFFIX}.png`),
  proof: path.join(SCREENSHOT_DIR, `ui_sales_proof_output${ARTIFACT_SUFFIX}.png`),
  roi: path.join(SCREENSHOT_DIR, `ui_sales_roi_output${ARTIFACT_SUFFIX}.png`),
  locked: path.join(SCREENSHOT_DIR, `ui_sales_lock_flow${ARTIFACT_SUFFIX}.png`),
  unlocked: path.join(SCREENSHOT_DIR, `ui_sales_unlock_restored${ARTIFACT_SUFFIX}.png`),
};
const PROOF_TRIGGERS = [
  '[data-testid="quickstart-proof-btn"]',
  '[data-testid="card-proof"]',
  '[data-testid="run-proof-btn"]',
];
const ROI_TRIGGERS = [
  '[data-testid="quickstart-roi-btn"]',
  '[data-testid="card-roi"]',
  '[data-testid="run-roi-btn"]',
];

function relPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

async function waitFor(page, selector, timeout = 20000) {
  await page.locator(selector).first().waitFor({ state: "visible", timeout });
}

async function isVisible(page, selector) {
  return page
    .locator(selector)
    .first()
    .isVisible()
    .catch(() => false);
}

async function waitForAnyVisible(page, selectors, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    for (const selector of selectors) {
      if (await isVisible(page, selector)) {
        return selector;
      }
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`Timed out waiting for any selector: ${selectors.join(", ")}`);
}

async function triggerAny(page, selectors, fallbackCommand) {
  for (const selector of selectors) {
    if (await isVisible(page, selector)) {
      await page.locator(selector).first().click();
      return selector;
    }
  }
  await runCommand(page, fallbackCommand);
  return `command:${fallbackCommand}`;
}

async function waitForChatContains(page, text, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const rows = await page.locator('[data-testid="chat-message"]').allTextContents();
    if (rows.some((row) => row.includes(text))) {
      return;
    }
    await page.waitForTimeout(160);
  }
  throw new Error(`Timed out waiting for chat content: ${text}`);
}

async function waitForRailStatusContains(page, text, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const status = await page.getByTestId("session-rail-status").textContent().catch(() => "");
    if ((status || "").includes(text)) {
      return;
    }
    await page.waitForTimeout(160);
  }
  throw new Error(`Timed out waiting for session rail status: ${text}`);
}

async function submitCreateSession(page, name, passphrase) {
  await page.getByTestId("new-thread-btn").click();
  await waitFor(page, '[data-testid="session-modal"]');
  await page.getByTestId("session-modal-name-input").fill(name);
  await page.getByTestId("session-modal-pass-input").fill(passphrase);
  await page.getByTestId("session-modal-submit-btn").click();
  await page.waitForTimeout(800);
  const stillOpen = await page.getByTestId("session-modal").isVisible().catch(() => false);
  if (stillOpen) {
    const error = await page.getByTestId("session-modal-error").textContent().catch(() => "");
    throw new Error(`Session create modal remained open: ${error || "unknown error"}`);
  }
}

async function runCommand(page, command) {
  await page.getByTestId("chat-input").fill(command);
  await page.getByRole("button", { name: "Execute Command" }).click();
}

async function run() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-self-sell-proof-"));
  let app;

  try {
    if (MODE === "packaged" && !fs.existsSync(PACKAGED_EXE)) {
      throw new Error(`Packaged executable is missing: ${PACKAGED_EXE}`);
    }

    app = await electron.launch(
      MODE === "packaged"
        ? {
            executablePath: PACKAGED_EXE,
            env: {
              ...process.env,
              CI: "1",
              NEURAL_USER_DATA_DIR: userDataDir,
              NEURAL_IGNORE_INTEGRITY: "1",
            },
          }
        : {
            args: ["."],
            cwd: ROOT,
            env: {
              ...process.env,
              NEURAL_USER_DATA_DIR: userDataDir,
              NEURAL_IGNORE_INTEGRITY: "1",
            },
          }
    );

    const page = await app.firstWindow();
    await waitFor(page, '[data-testid="top-status-bar"]');
    await waitFor(page, '[data-testid="workspace-panel"]');
    await runCommand(page, "/clear");
    await page.waitForTimeout(500);

    // Conversion surface (works for quickstart and non-quickstart entry states).
    await waitForAnyVisible(page, [...PROOF_TRIGGERS, ...ROI_TRIGGERS], 20000);
    await page.screenshot({ path: SHOTS.quickstart, fullPage: true });

    // Trigger proof narrative from whichever CTA is currently exposed.
    const proofTrigger = await triggerAny(page, PROOF_TRIGGERS, "/proof");
    await waitForChatContains(page, "90-Second Value Proof");
    await page.screenshot({ path: SHOTS.proof, fullPage: true });

    // Trigger ROI narrative from whichever CTA is currently exposed.
    const roiTrigger = await triggerAny(page, ROI_TRIGGERS, "/roi");
    await waitForChatContains(page, "ROI Snapshot");
    await page.screenshot({ path: SHOTS.roi, fullPage: true });

    // Demonstrate persistence + lock flow in a real session.
    const sessionName = `SalesProof_${Date.now().toString(36).toUpperCase()}`;
    const passphrase = "sales-proof-pass";
    await submitCreateSession(page, sessionName, passphrase);
    await runCommand(page, "/guard");
    await waitForChatContains(page, "Security Guard: ACTIVE");
    await page.getByTestId("save-active-session-btn").click();
    await waitForRailStatusContains(page, "Saved", 12000);
    await page.getByTestId("lock-active-session-btn").click();
    await waitFor(page, '[data-testid="session-lock-banner"]');
    await page.screenshot({ path: SHOTS.locked, fullPage: true });

    // Unlock and prove restore continuity.
    await page.getByTestId("session-lock-unlock-btn").click();
    await waitFor(page, '[data-testid="session-modal"]');
    await page.getByTestId("session-modal-pass-input").fill(passphrase);
    await page.getByTestId("session-modal-submit-btn").click();
    await page.waitForTimeout(1200);
    await waitForChatContains(page, "Security Guard: ACTIVE");
    await page.screenshot({ path: SHOTS.unlocked, fullPage: true });

    const relativeShots = Object.fromEntries(
      Object.entries(SHOTS).map(([key, shotPath]) => [key, relPath(shotPath)])
    );

    const result = {
      ok: true,
      generatedAt: new Date().toISOString(),
      mode: MODE,
      launchTarget: MODE === "packaged" ? relPath(PACKAGED_EXE) : ".",
      shots: relativeShots,
      checks: {
        proof: true,
        roi: true,
        lockFlow: true,
      },
      triggerPath: {
        proof: proofTrigger,
        roi: roiTrigger,
      },
      reportPath: relPath(REPORT_PATH),
    };
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (app) {
      await app.close();
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup failure
    }
  }
}

run().catch((error) => {
  console.error("[self-sell-proof] failed:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
